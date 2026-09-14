import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { formatPrice, storeConfig } from "../config";
import { useCart } from "../context/CartContext";

const INITIAL_FORM = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  delivery_type: "delivery",
  delivery_address: "",
  delivery_notes: "",
};

export default function OrderRequest() {
  const { items, total, clearCart } = useCart();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.customer_name.trim() || !form.customer_phone.trim()) {
      setError("Please provide your name and phone number.");
      return;
    }

    if (form.delivery_type === "delivery" && !form.delivery_address.trim()) {
      setError("Please provide a delivery address or choose pickup.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/orders", {
        source: "website",
        ...form,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim() || null,
        delivery_address:
          form.delivery_type === "delivery" ? form.delivery_address.trim() : null,
        items: items.map((item) => ({
          product_id: item.id,
          size: item.size,
          quantity: Number(item.qty),
        })),
      });

      const createdOrderNumber =
        response.data?.order_number || response.data?.orderNumber || response.data?.id;

      if (!createdOrderNumber) {
        throw new Error("The order response did not include an order number.");
      }

      setOrderNumber(String(createdOrderNumber));
      clearCart();
    } catch (err) {
      console.error("Error submitting order request:", err);
      setError(
        err.response?.data?.error ||
          "We could not submit your order request. Please try again or contact us directly."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (orderNumber) {
    return (
      <main className="container order-page">
        <div className="order-success">
          <div className="hero-eyebrow">Request received</div>
          <h1 className="page-title">Thank you.</h1>
          <p>
            Your order request is <strong>#{orderNumber}</strong>. We will contact you to confirm
            the items and delivery details.
          </p>
          <p className="notice">
            {storeConfig.cashPaymentLabel}. {storeConfig.deliveryLabel}.
          </p>
          <Link to="/" className="btn">
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="container order-page">
        <h1 className="page-title">Place an order request</h1>
        <div className="empty-state">
          Your bag is empty. <Link to="/shop/women">Browse the collection</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container order-page">
      <div className="order-heading">
        <div className="hero-eyebrow">Cash order request</div>
        <h1 className="page-title">Complete your request</h1>
        <p className="order-intro">
          Send us your details and we will confirm availability with you. Payment is handled in
          cash in real life; this form does not charge you.
        </p>
      </div>

      <div className="order-layout">
        <form className="order-form" onSubmit={handleSubmit}>
          <section className="order-section">
            <h2>Contact details</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="customer_name">Name</label>
                <input
                  id="customer_name"
                  name="customer_name"
                  className="form-control"
                  value={form.customer_name}
                  onChange={updateField}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="customer_phone">Phone / WhatsApp</label>
                <input
                  id="customer_phone"
                  name="customer_phone"
                  className="form-control"
                  type="tel"
                  value={form.customer_phone}
                  onChange={updateField}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="customer_email">Email (optional)</label>
              <input
                id="customer_email"
                name="customer_email"
                className="form-control"
                type="email"
                value={form.customer_email}
                onChange={updateField}
              />
            </div>
          </section>

          <section className="order-section">
            <h2>Fulfilment</h2>
            <div className="form-group">
              <label htmlFor="delivery_type">How would you like to receive it?</label>
              <select
                id="delivery_type"
                name="delivery_type"
                className="form-control"
                value={form.delivery_type}
                onChange={updateField}
              >
                <option value="delivery">Delivery</option>
                <option value="pickup">Pickup</option>
              </select>
            </div>
            {form.delivery_type === "delivery" && (
              <div className="form-group">
                <label htmlFor="delivery_address">Delivery address</label>
                <textarea
                  id="delivery_address"
                  name="delivery_address"
                  className="form-control"
                  value={form.delivery_address}
                  onChange={updateField}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="delivery_notes">Notes (optional)</label>
              <textarea
                id="delivery_notes"
                name="delivery_notes"
                className="form-control"
                value={form.delivery_notes}
                onChange={updateField}
                placeholder="Preferred time, landmark, or other instructions"
              />
            </div>
          </section>

          {error && <div className="error-text form-error">{error}</div>}
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Sending request..." : "Send order request"}
          </button>
          <Link to="/cart" className="btn btn-outline order-back-button">
            Back to bag
          </Link>
        </form>

        <aside className="order-summary">
          <h2>Your bag</h2>
          {items.map((item) => (
            <div className="order-summary-item" key={`${item.id}-${item.size}`}>
              <div>
                <strong>{item.name}</strong>
                <span>
                  Size {item.size} · Qty {item.qty}
                </span>
              </div>
              <span>{formatPrice(Number(item.price) * Number(item.qty))}</span>
            </div>
          ))}
          <div className="cart-summary-row total">
            <span>Estimated total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <p className="notice">
            {storeConfig.cashPaymentLabel}. {storeConfig.deliveryLabel}.
          </p>
        </aside>
      </div>
    </main>
  );
}
