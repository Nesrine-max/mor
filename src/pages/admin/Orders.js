import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { formatPrice } from "../../config";

const ORDER_STATUSES = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
const DELIVERY_STATUSES = [
  "not_required",
  "awaiting_assignment",
  "assigned",
  "out_for_delivery",
  "delivered",
  "failed",
  "returned",
];
const CASH_STATUSES = ["cash_outstanding", "cash_collected", "partially_collected"];

function normalizeOrders(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.orders) ? data.orders : [];
}

function labelize(value) {
  return String(value || "—")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function totalFor(order) {
  if (order.total !== undefined && order.total !== null) return order.total;
  if (order.total_minor !== undefined && order.total_minor !== null) {
    return Number(order.total_minor) / 100;
  }
  return 0;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    orderStatus: "",
    deliveryStatus: "",
    cashStatus: "",
  });
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/orders");
      const nextOrders = normalizeOrders(response.data);
      setOrders(nextOrders);
      setSelectedId((current) => current || nextOrders[0]?.id || null);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.response?.data?.error || "We could not load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch = !search ||
        [order.order_number, order.customer_name, order.customer_phone, order.source]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      const matchesOrder = !filters.orderStatus || order.order_status === filters.orderStatus;
      const matchesDelivery = !filters.deliveryStatus || order.delivery_status === filters.deliveryStatus;
      const matchesCash = !filters.cashStatus || order.cash_status === filters.cashStatus;
      return matchesSearch && matchesOrder && matchesDelivery && matchesCash;
    });
  }, [orders, filters]);

  const selectedOrder = orders.find((order) => order.id === selectedId) || null;
  const selectedHistory = Array.isArray(selectedOrder?.status_history)
    ? selectedOrder.status_history
    : Array.isArray(selectedOrder?.order_status_history)
      ? selectedOrder.order_status_history
      : [];

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function updateStatus(order, field, value) {
    const key = `${order.id}-${field}`;
    setUpdating(key);
    setError("");

    try {
      const response = await api.put(`/orders/${order.id}`, { [field]: value });
      const updatedOrder = response.data?.order || response.data || { ...order, [field]: value };
      setOrders((current) => current.map((item) => (item.id === order.id ? updatedOrder : item)));
    } catch (err) {
      console.error("Error updating order:", err);
      setError(err.response?.data?.error || "We could not update this order.");
    } finally {
      setUpdating("");
    }
  }

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="admin-subtitle">Track website requests and offline orders in one place.</p>
        </div>
        <Link to="/admin/orders/new" className="btn">
          + New Order
        </Link>
      </div>

      <div className="admin-filter-grid">
        <input
          className="form-control"
          name="search"
          value={filters.search}
          onChange={updateFilter}
          placeholder="Search order, customer, phone..."
          aria-label="Search orders"
        />
        <select className="form-control" name="orderStatus" value={filters.orderStatus} onChange={updateFilter}>
          <option value="">All order statuses</option>
          {ORDER_STATUSES.map((status) => <option key={status} value={status}>{labelize(status)}</option>)}
        </select>
        <select className="form-control" name="deliveryStatus" value={filters.deliveryStatus} onChange={updateFilter}>
          <option value="">All delivery statuses</option>
          {DELIVERY_STATUSES.map((status) => <option key={status} value={status}>{labelize(status)}</option>)}
        </select>
        <select className="form-control" name="cashStatus" value={filters.cashStatus} onChange={updateFilter}>
          <option value="">All cash statuses</option>
          {CASH_STATUSES.map((status) => <option key={status} value={status}>{labelize(status)}</option>)}
        </select>
      </div>

      {error && <div className="error-text admin-error">{error}</div>}
      {loading && <div className="empty-state">Loading orders...</div>}
      {!loading && !error && orders.length === 0 && (
        <div className="empty-state">No orders have been created yet.</div>
      )}
      {!loading && orders.length > 0 && filteredOrders.length === 0 && (
        <div className="empty-state">No orders match these filters.</div>
      )}
      {!loading && filteredOrders.length > 0 && (
        <div className="admin-order-layout">
          <div className="admin-order-table-wrap">
            <table className="admin-table admin-order-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Source</th>
                  <th>Order status</th>
                  <th>Delivery</th>
                  <th>Cash</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={selectedId === order.id ? "selected-row" : ""}
                    onClick={() => setSelectedId(order.id)}
                  >
                    <td>
                      <button className="table-link" onClick={() => setSelectedId(order.id)}>
                        #{order.order_number || order.id}
                      </button>
                      <small>{formatDate(order.created_at)}</small>
                    </td>
                    <td>
                      <strong>{order.customer_name || "Unnamed customer"}</strong>
                      <small>{order.customer_phone || "No phone"}</small>
                    </td>
                    <td><span className="status-pill source-pill">{labelize(order.source)}</span></td>
                    <td>
                      <select
                        className="status-select"
                        value={order.order_status || "pending"}
                        disabled={updating === `${order.id}-order_status`}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => updateStatus(order, "order_status", event.target.value)}
                        aria-label={`Order status for ${order.order_number || order.id}`}
                      >
                        {ORDER_STATUSES.map((status) => <option key={status} value={status}>{labelize(status)}</option>)}
                      </select>
                    </td>
                    <td><span className={`status-pill status-${order.delivery_status || "unknown"}`}>{labelize(order.delivery_status)}</span></td>
                    <td><span className={`status-pill status-${order.cash_status || "unknown"}`}>{labelize(order.cash_status)}</span></td>
                    <td>{formatPrice(totalFor(order))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedOrder && (
            <aside className="admin-order-detail stat-card">
              <div className="detail-heading">
                <div>
                  <div className="product-category">Order</div>
                  <h2>#{selectedOrder.order_number || selectedOrder.id}</h2>
                </div>
                <button className="icon-btn" onClick={() => setSelectedId(null)}>Close</button>
              </div>
              <div className="detail-block">
                <strong>{selectedOrder.customer_name || "Unnamed customer"}</strong>
                <span>{selectedOrder.customer_phone || "No phone"}</span>
                {selectedOrder.customer_email && <span>{selectedOrder.customer_email}</span>}
              </div>
              <div className="detail-block">
                <span>{labelize(selectedOrder.delivery_type)}</span>
                {selectedOrder.delivery_address && <span>{selectedOrder.delivery_address}</span>}
                {selectedOrder.delivery_notes && <span>Note: {selectedOrder.delivery_notes}</span>}
              </div>
              <div className="detail-block">
                <label htmlFor="detail-delivery-status">Delivery status</label>
                <select
                  id="detail-delivery-status"
                  className="form-control"
                  value={selectedOrder.delivery_status || "not_required"}
                  disabled={updating === `${selectedOrder.id}-delivery_status`}
                  onChange={(event) => updateStatus(selectedOrder, "delivery_status", event.target.value)}
                >
                  {DELIVERY_STATUSES.map((status) => <option key={status} value={status}>{labelize(status)}</option>)}
                </select>
              </div>
              <div className="detail-block">
                <label htmlFor="detail-cash-status">Cash status</label>
                <select
                  id="detail-cash-status"
                  className="form-control"
                  value={selectedOrder.cash_status || "cash_outstanding"}
                  disabled={updating === `${selectedOrder.id}-cash_status`}
                  onChange={(event) => updateStatus(selectedOrder, "cash_status", event.target.value)}
                >
                  {CASH_STATUSES.map((status) => <option key={status} value={status}>{labelize(status)}</option>)}
                </select>
              </div>
              <div className="detail-total">
                <span>Total</span>
                <strong>{formatPrice(totalFor(selectedOrder))}</strong>
              </div>
              <div className="detail-block">
                <label>Items</label>
                {(selectedOrder.items || selectedOrder.order_items || []).map((item, index) => (
                  <span key={item.id || `${item.product_id}-${index}`}>
                    {item.quantity || item.qty} × {item.product_name_snapshot || item.name} · Size {item.size || "—"}
                  </span>
                ))}
              </div>
              <div className="detail-block">
                <label>Status history</label>
                {selectedHistory.length === 0 && <span>No history was returned for this order.</span>}
                {selectedHistory.map((entry, index) => (
                  <span key={entry.id || `${entry.field_name}-${entry.created_at || index}`}>
                    {formatDate(entry.created_at)} - {labelize(entry.field_name)}: {labelize(entry.old_value)} to {labelize(entry.new_value)}
                    {entry.note ? ` (${entry.note})` : ""}
                  </span>
                ))}
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
