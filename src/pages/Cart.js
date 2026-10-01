import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatPrice, storeConfig } from "../config";

export default function Cart() {
  const { items, updateQty, removeFromCart, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="container cart-page">
        <h1 className="page-title">Your Bag</h1>
        <div className="empty-state">
          Your bag is empty. <Link to="/">Continue shopping →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <h1 className="page-title">Your Bag</h1>

      <div>
        {items.map((item) => (
          <div className="cart-item" key={`${item.id}-${item.size}`}>
            <img src={item.image_url} alt={item.name} />
            <div>
              <div className="product-name">{item.name}</div>
              <div className="product-category">Size: {item.size}</div>
              <div className="product-price">{formatPrice(item.price)}</div>
            </div>
            <div className="qty-control">
              <button onClick={() => updateQty(item.id, item.size, item.qty - 1)}>-</button>
              <span>{item.qty}</span>
              <button onClick={() => updateQty(item.id, item.size, item.qty + 1)}>+</button>
            </div>
            <button className="icon-btn" onClick={() => removeFromCart(item.id, item.size)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-summary-row">
          <span>Subtotal</span>
          <span>{formatPrice(total)}</span>
        </div>
        <div className="cart-summary-row">
          <span>Delivery</span>
          <span>Confirmed separately</span>
        </div>
        <div className="cart-summary-row total">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        <Link to="/order" className="btn" style={{ width: "100%", marginTop: 10, textAlign: "center" }}>
          Place Order Request
        </Link>
        <p className="cart-note">
          {storeConfig.cashPaymentLabel}. {storeConfig.deliveryLabel}.
        </p>
        <button
          className="btn btn-outline"
          style={{ width: "100%", marginTop: 10 }}
          onClick={clearCart}
        >
          Clear Bag
        </button>
      </div>
    </div>
  );
}
