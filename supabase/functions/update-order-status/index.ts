import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

function getServiceKey() {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys) as Record<string, unknown>;
      if (typeof parsed.default === "string" && parsed.default) return parsed.default;
    } catch {
      // Fall back to the legacy runtime variable if the new key map is unavailable.
    }
  }

  return Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

const serviceKey = getServiceKey();
const allowedOrigin = Deno.env.get("APP_ORIGIN") ?? "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function getAdminId(request: Request) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const { data: userData, error: userError } = await adminClient.auth.getUser(token);
  if (userError || !userData.user) return null;

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  return !profileError && profile?.role === "admin" ? userData.user.id : null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "Order service is not configured" }, 500);
  }

  try {
    const adminId = await getAdminId(request);
    if (!adminId) return jsonResponse({ error: "Admin access is required" }, 403);

    const body = await request.json();
    const orderId = cleanString(body.order_id);
    if (!orderId) return jsonResponse({ error: "Order ID is required" }, 400);

    const hasStatusChange = ["order_status", "delivery_status", "cash_status"].some(
      (field) => body[field] !== undefined && body[field] !== null
    );
    if (!hasStatusChange) return jsonResponse({ error: "At least one status is required" }, 400);

    const { data, error } = await adminClient.rpc("update_order_status", {
      p_order_id: orderId,
      p_order_status: body.order_status ?? null,
      p_delivery_status: body.delivery_status ?? null,
      p_cash_status: body.cash_status ?? null,
      p_note: cleanString(body.note) || null,
      p_changed_by: adminId,
    });

    if (error) {
      console.error("update_order_status RPC failed", error);
      const clientError = error.code === "22023" || error.message?.includes("status");
      return jsonResponse(
        { error: clientError ? error.message : "Could not update order" },
        clientError ? 400 : 500
      );
    }

    return jsonResponse(data);
  } catch (error) {
    console.error("update-order-status request failed", error);
    return jsonResponse({ error: "Invalid order status request" }, 400);
  }
});
