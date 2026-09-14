import axios from "axios";
import { storeConfig } from "./config";
import { isSupabaseConfigured, supabase } from "./supabase";

const legacyApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

legacyApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("mor_admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function apiError(message, status = 500, details = null) {
  const error = new Error(message);
  error.response = {
    status,
    data: { error: message, details },
  };
  return error;
}

function throwIfError(error, fallback) {
  if (error) {
    throw apiError(error.message || fallback, error.status || 500, error);
  }
}

function normalizeSizes(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeProduct(row) {
  const category = row.category || row.categories || {};
  const price = row.price !== undefined ? row.price : Number(row.price_minor || 0) / 100;

  return {
    ...row,
    price: Number(price),
    stock: row.stock !== undefined ? row.stock : Number(row.stock_quantity || 0),
    sizes: row.sizes || [],
    category_name: row.category_name || category.name || "",
  };
}

function productPayload(product) {
  const price = Number(
    product.price !== undefined ? product.price : Number(product.price_minor || 0) / 100
  );

  return {
    name: String(product.name || "").trim(),
    slug: product.slug || slugify(product.name),
    description: String(product.description || ""),
    price_minor: Math.round(price * 100),
    currency: product.currency || storeConfig.currency,
    gender: product.gender || "unisex",
    category_id: product.category_id ? Number(product.category_id) : null,
    stock_quantity: Number(product.stock ?? product.stock_quantity ?? 0),
    sizes: normalizeSizes(product.sizes),
    featured: Boolean(product.featured),
    active: product.active === undefined ? true : Boolean(product.active),
    image_url: product.image_url || null,
  };
}

async function getCategories() {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order").order("name");
  throwIfError(error, "Could not load categories");
  return { data: data || [] };
}

async function getProducts(config = {}) {
  const params = config.params || {};
  let query = supabase
    .from("products")
    .select("*, category:categories(id, name, slug)")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (params.featured) query = query.eq("featured", true);
  if (params.gender && params.gender !== "all") query = query.eq("gender", params.gender);

  if (params.category) {
    const categoryResult = await supabase
      .from("categories")
      .select("id")
      .eq("slug", params.category)
      .maybeSingle();
    throwIfError(categoryResult.error, "Could not find the selected category");
    if (!categoryResult.data) return { data: [] };
    query = query.eq("category_id", categoryResult.data.id);
  }

  const { data, error } = await query;
  throwIfError(error, "Could not load products");
  return { data: (data || []).map(normalizeProduct) };
}

async function getProduct(id) {
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(id, name, slug)")
    .eq("id", id)
    .single();
  throwIfError(error, "Could not load this product");
  return { data: normalizeProduct(data) };
}

function normalizeOrder(order) {
  return {
    ...order,
    total: Number(order.total_minor || 0) / 100,
    items: order.items || [],
    status_history: order.status_history || [],
  };
}

async function getOrder(id) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*), status_history:order_status_history(*)")
    .eq("id", id)
    .single();
  throwIfError(error, "Could not load order");
  return { data: normalizeOrder(data) };
}

async function getOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*), status_history:order_status_history(*)")
    .order("created_at", { ascending: false });
  throwIfError(error, "Could not load orders");

  const orders = (data || []).map(normalizeOrder);

  return { data: { orders, total: orders.length } };
}

async function invokeFunction(name, body, fallback) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    throw apiError(error.message || fallback, error.status || 500, error);
  }
  return { data };
}

async function supabaseGet(path, config) {
  if (path === "/categories") return getCategories();
  if (path === "/products") return getProducts(config);
  if (path.startsWith("/products/")) return getProduct(path.split("/")[2]);
  if (path === "/orders") return getOrders();
  throw apiError(`Supabase GET route is not implemented: ${path}`, 404);
}

async function supabasePost(path, body) {
  if (path === "/orders") return invokeFunction("create-order", body, "Could not create order");

  if (path === "/products") {
    const { data, error } = await supabase
      .from("products")
      .insert(productPayload(body))
      .select("*, category:categories(id, name, slug)")
      .single();
    throwIfError(error, "Could not create product");
    return { data: normalizeProduct(data) };
  }

  if (path === "/categories") {
    const { data, error } = await supabase
      .from("categories")
      .insert({ name: String(body.name || "").trim(), slug: slugify(body.name) })
      .select("*")
      .single();
    throwIfError(error, "Could not create category");
    return { data };
  }

  throw apiError(`Supabase POST route is not implemented: ${path}`, 404);
}

async function supabasePut(path, body) {
  const orderMatch = path.match(/^\/orders\/([^/]+)$/);
  if (orderMatch) {
    await invokeFunction(
      "update-order-status",
      { order_id: orderMatch[1], ...body },
      "Could not update order"
    );
    const refreshedOrder = await getOrder(orderMatch[1]);
    return { data: { order: refreshedOrder.data } };
  }

  const productMatch = path.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    const { data, error } = await supabase
      .from("products")
      .update(productPayload(body))
      .eq("id", productMatch[1])
      .select("*, category:categories(id, name, slug)")
      .single();
    throwIfError(error, "Could not update product");
    return { data: normalizeProduct(data) };
  }

  const categoryMatch = path.match(/^\/categories\/([^/]+)$/);
  if (categoryMatch) {
    const { data, error } = await supabase
      .from("categories")
      .update({ name: String(body.name || "").trim(), slug: slugify(body.name) })
      .eq("id", categoryMatch[1])
      .select("*")
      .single();
    throwIfError(error, "Could not update category");
    return { data };
  }

  throw apiError(`Supabase PUT route is not implemented: ${path}`, 404);
}

async function supabaseDelete(path) {
  const productMatch = path.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    const { error } = await supabase.from("products").delete().eq("id", productMatch[1]);
    throwIfError(error, "Could not delete product");
    return { data: null };
  }

  const categoryMatch = path.match(/^\/categories\/([^/]+)$/);
  if (categoryMatch) {
    const { error } = await supabase.from("categories").delete().eq("id", categoryMatch[1]);
    throwIfError(error, "Could not delete category");
    return { data: null };
  }

  throw apiError(`Supabase DELETE route is not implemented: ${path}`, 404);
}

const supabaseApi = {
  get: supabaseGet,
  post: supabasePost,
  put: supabasePut,
  delete: supabaseDelete,
};

const api = isSupabaseConfigured ? supabaseApi : legacyApi;

export default api;
