import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";

const SOURCES = ["whatsapp", "phone", "instagram", "walk_in", "other"];

function productSizes(product) {
  return String(product?.sizes || "")
    .split(",")
    .map((size) => size.trim())
    .filter(Boolean);
}

export default function AdminOrderForm() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    source: "whatsapp",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    delivery_type: "delivery",
    delivery_address: "",
    delivery_notes: "",
  });
  const [items, setItems] = useState([{ product_id: "", size: "", quantity: 1 }]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    api
      .get("/products")
      .then((response) => {
        if (mounted) setProducts(Array.isArray(response.data) ? response.data : []);
      })
      .catch((err) => {
        if (mounted) setError(err.response?.data?.error || "We could not load products.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateItem(index, field, value) {
    setItems((current) => current.map((item, itemIndex) => {
      if (index !== itemIndex) return item;

      if (field === "product_id") {
        const product = products.find((candidate) => String(candidate.id) === String(value));
        return { ...item, product_id: value, size: productSizes(product)[0] || "" };
      }

      return { ...item, [field]: value };
    }));
  }

  function addItem() {
    setItems((current) => [...current, { product_id: "", size: "", quantity: 1 }]);
  }

  function removeItem(index) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.customer_name.trim() || !form.customer_phone.trim()) {
      setError("Customer name and phone are required.");
      return;
    }

    if (form.delivery_type === "delivery" && !form.delivery_address.trim()) {
      setError("A delivery address is required for delivery orders.");
      return;
    }

    if (items.some((item) => !item.product_id || !item.size || Number(item.quantity) < 1)) {
      setError("Choose a product, size, and quantity for every line.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/orders", {
        source: form.source,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim() || null,
        delivery_type: form.delivery_type,
        delivery_address: form.delivery_type === "delivery" ? form.delivery_address.trim() : null,
        delivery_notes: form.delivery_notes.trim() || null,
        items: items.map((item) => ({
          product_id: item.product_id,
          size: item.size,
          quantity: Number(item.quantity),
        })),
      });
      navigate("/admin/orders");
    } catch (err) {
      console.error("Error creating manual order:", err);
      setError(err.response?.data?.error || "We could not create this order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="page-title">New Order</h1>
          <p className="admin-subtitle">Record an order received outside the website.</p>
        </div>
        <Link to="/admin/orders" className="btn btn-outline">Back to Orders</Link>
      </div>

      {loading && <div className="empty-state">Loading products...</div>}
      {!loading && (
        <form className="admin-order-form" onSubmit={handleSubmit}>
          <section className="stat-card">
            <h2>Customer and source</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="source">Order source</label>
                <select id="source" name="source" className="form-control" value={form.source} onChange={updateField}>
                  {SOURCES.map((source) => <option key={source} value={source}>{source.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="customer_name">Customer name</label>
                <input id="customer_name" name="customer_name" className="form-control" value={form.customer_name} onChange={updateField} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="customer_phone">Phone / WhatsApp</label>
                <input id="customer_phone" name="customer_phone" className="form-control" type="tel" value={form.customer_phone} onChange={updateField} required />
              </div>
              <div className="form-group">
                <label htmlFor="customer_email">Email (optional)</label>
                <input id="customer_email" name="customer_email" className="form-control" type="email" value={form.customer_email} onChange={updateField} />
              </div>
            </div>
          </section>

          <section className="stat-card">
            <h2>Items</h2>
            {items.map((item, index) => {
              const product = products.find((candidate) => String(candidate.id) === String(item.product_id));
              const sizes = productSizes(product);

              return (
                <div className="admin-order-line" key={`${index}-${item.product_id}`}>
                  <select className="form-control" value={item.product_id} onChange={(event) => updateItem(index, "product_id", event.target.value)} aria-label="Product">
                    <option value="">Select product</option>
                    {products.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
                  </select>
                  <select className="form-control" value={item.size} onChange={(event) => updateItem(index, "size", event.target.value)} aria-label="Size" disabled={!product}>
                    <option value="">Size</option>
                    {sizes.map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                  <input className="form-control quantity-input" type="number" min="1" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} aria-label="Quantity" />
                  <button type="button" className="icon-btn" onClick={() => removeItem(index)} disabled={items.length === 1}>Remove</button>
                </div>
              );
            })}
            <button type="button" className="btn btn-outline" onClick={addItem}>+ Add item</button>
          </section>

          <section className="stat-card">
            <h2>Fulfilment</h2>
            <div className="form-group">
              <label htmlFor="delivery_type">Method</label>
              <select id="delivery_type" name="delivery_type" className="form-control" value={form.delivery_type} onChange={updateField}>
                <option value="delivery">Delivery</option>
                <option value="pickup">Pickup</option>
              </select>
            </div>
            {form.delivery_type === "delivery" && (
              <div className="form-group">
                <label htmlFor="delivery_address">Address</label>
                <textarea id="delivery_address" name="delivery_address" className="form-control" value={form.delivery_address} onChange={updateField} required />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="delivery_notes">Notes</label>
              <textarea id="delivery_notes" name="delivery_notes" className="form-control" value={form.delivery_notes} onChange={updateField} />
            </div>
          </section>

          {error && <div className="error-text form-error">{error}</div>}
          <button className="btn" type="submit" disabled={submitting || products.length === 0}>
            {submitting ? "Creating order..." : "Create order"}
          </button>
        </form>
      )}
    </div>
  );
}
