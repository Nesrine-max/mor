import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { formatPrice } from "../../config";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/products"), api.get("/categories"), api.get("/orders")])
      .then(([productsRes, categoriesRes, ordersRes]) => {
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
        setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.orders || []);
      })
      .catch((err) => {
        console.error("Error loading dashboard:", err);
        setError(err.response?.data?.error || "Some dashboard data could not be loaded.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const totalStock = products.reduce((sum, p) => sum + Number(p.stock ?? p.stock_quantity ?? 0), 0);
  const featuredCount = products.filter((p) => p.featured).length;
  const pendingOrders = orders.filter((order) => ["pending", "confirmed", "preparing"].includes(order.order_status)).length;
  const readyOrders = orders.filter(
    (order) => order.order_status === "ready" || order.delivery_status === "out_for_delivery"
  ).length;
  const outstandingCash = orders
    .filter((order) => order.cash_status !== "cash_collected")
    .reduce((sum, order) => sum + Number(order.total ?? Number(order.total_minor || 0) / 100), 0);
  const orderValue = orders.reduce(
    (sum, order) => sum + Number(order.total ?? Number(order.total_minor || 0) / 100),
    0
  );

  return (
    <div>
      <div className="admin-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      {error && <div className="error-text admin-error">{error}</div>}
      {loading && <div className="admin-subtitle">Loading the latest catalogue and order data...</div>}

      <div className="stat-cards">
        <div className="stat-card">
          <div className="value">{products.length}</div>
          <div className="label">Products</div>
        </div>
        <div className="stat-card">
          <div className="value">{categories.length}</div>
          <div className="label">Categories</div>
        </div>
        <div className="stat-card">
          <div className="value">{totalStock}</div>
          <div className="label">Units in Stock</div>
        </div>
        <div className="stat-card">
          <div className="value">{featuredCount}</div>
          <div className="label">Featured Items</div>
        </div>
        <div className="stat-card">
          <div className="value">{pendingOrders}</div>
          <div className="label">Open Orders</div>
        </div>
        <div className="stat-card">
          <div className="value">{readyOrders}</div>
          <div className="label">Ready / In Delivery</div>
        </div>
        <div className="stat-card">
          <div className="value">{formatPrice(outstandingCash)}</div>
          <div className="label">Cash Outstanding</div>
        </div>
        <div className="stat-card">
          <div className="value">{formatPrice(orderValue)}</div>
          <div className="label">Recorded Order Value</div>
        </div>
      </div>

      <div className="admin-section-heading">
        <h2 className="section-title" style={{ textAlign: "left", fontSize: 22 }}>
          Order queue
        </h2>
        <Link to="/admin/orders" className="table-link">View all orders</Link>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Order status</th>
            <th>Delivery</th>
            <th>Cash</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.slice(0, 6).map((order) => (
            <tr key={order.id}>
              <td>#{order.order_number || order.id}</td>
              <td>{order.customer_name || "Unnamed customer"}</td>
              <td>{String(order.order_status || "pending").replace(/_/g, " ")}</td>
              <td>{String(order.delivery_status || "not_required").replace(/_/g, " ")}</td>
              <td>{String(order.cash_status || "cash_outstanding").replace(/_/g, " ")}</td>
              <td>{formatPrice(order.total ?? Number(order.total_minor || 0) / 100)}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan="6">No orders have been created yet.</td>
            </tr>
          )}
        </tbody>
      </table>

      <h2 className="section-title" style={{ textAlign: "left", fontSize: 22, marginTop: 56 }}>
        Recently Added
      </h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.slice(0, 6).map((p) => (
            <tr key={p.id}>
              <td>
                <img src={p.image_url} alt={p.name} />
              </td>
              <td>{p.name}</td>
              <td>{p.category_name}</td>
              <td>{formatPrice(p.price)}</td>
              <td>{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
