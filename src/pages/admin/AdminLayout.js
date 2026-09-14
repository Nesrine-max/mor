import React from "react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function AdminLayout() {
  const { isAuthenticated, email, logout } = useAdminAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <span className="logo">
          M<span>O</span>R
        </span>
        <nav className="admin-nav">
          <NavLink to="/admin/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/products" className={({ isActive }) => (isActive ? "active" : "")}>
            Products
          </NavLink>
          <NavLink to="/admin/categories" className={({ isActive }) => (isActive ? "active" : "")}>
            Categories
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => (isActive ? "active" : "")}>
            Orders
          </NavLink>
        </nav>
        <div style={{ marginTop: 40, fontSize: 12, color: "var(--text-muted)" }}>
          <div style={{ marginBottom: 10 }}>{email}</div>
          <button className="icon-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
