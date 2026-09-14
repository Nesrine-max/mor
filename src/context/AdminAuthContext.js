import React, { createContext, useContext, useState } from "react";
import api from "../api";

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("mor_admin_token"));
  const [email, setEmail] = useState(() => localStorage.getItem("mor_admin_email"));

  async function login(loginEmail, password) {
    const res = await api.post("/auth/login", { email: loginEmail, password });
    localStorage.setItem("mor_admin_token", res.data.token);
    localStorage.setItem("mor_admin_email", res.data.email);
    setToken(res.data.token);
    setEmail(res.data.email);
  }

  function logout() {
    localStorage.removeItem("mor_admin_token");
    localStorage.removeItem("mor_admin_email");
    setToken(null);
    setEmail(null);
  }

  return (
    <AdminAuthContext.Provider value={{ token, email, login, logout, isAuthenticated: !!token }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}