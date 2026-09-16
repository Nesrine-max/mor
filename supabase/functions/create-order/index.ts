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

async function isAdminRequest(request: Request) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { isAdmin: false, userId: null };

  const { data: userData, error: userError } = await adminClient.auth.getUser(token);
  if (userError || !userData.user) return { isAdmin: false, userId: null };

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  return {
    isAdmin: !profileError && profile?.role === "admin",
    userId: userData.user.id,
  };
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
    const body = await request.json();
    const source = cleanString(body.source) || "website";
    const adminRequest = await isAdminRequest(request);

    if (source !== "website" && !adminRequest.isAdmin) {
      return jsonResponse({ error: "Only admins can create offline-source orders" }, 403);
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return jsonResponse({ error: "At least one item is required" }, 400);
    }

    const items = body.items.map((item: Record<string, unknown>) => ({
      product_id: Number(item.product_id),
      size: cleanString(item.size),
      quantity: Number(item.quantity),
    }));

    if (items.some((item) => !Number.isInteger(item.product_id) || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      return jsonResponse({ error: "Every item needs a valid product and quantity" }, 400);
    }

    const deliveryType = cleanString(body.delivery_type) || "delivery";
    const deliveryAddress = cleanString(body.delivery_address);

    if (deliveryType === "delivery" && !deliveryAddress) {
      return jsonResponse({ error: "A delivery address is required" }, 400);
    }

    const { data, error } = await adminClient.rpc("create_order", {
      p_source: source,
      p_customer_name: cleanString(body.customer_name),
      p_customer_phone: cleanString(body.customer_phone),
      p_customer_email: cleanString(body.customer_email) || null,
      p_delivery_type: deliveryType,
      p_delivery_address: deliveryAddress || null,
      p_delivery_notes: cleanString(body.delivery_notes) || null,
      p_items: items,
      p_created_by: adminRequest.userId,
    });

    if (error) {
      console.error("create_order RPC failed", error);
      const clientError = error.code === "22023" || error.message?.includes("required") || error.message?.includes("unavailable");
      return jsonResponse({ error: clientError ? error.message : "Could not create order" }, clientError ? 400 : 500);
    }

    return jsonResponse(data, 201);
  } catch (error) {
    console.error("create-order request failed", error);
    return jsonResponse({ error: "Invalid order request" }, 400);
  }
});
