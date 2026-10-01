import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api";
import { isSupabaseConfigured, supabase } from "../supabase";

const AdminAuthContext = createContext();

function authError(message) {
  const error = new Error(message);
  error.response = { data: { error: message } };
  return error;
}

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    isSupabaseConfigured ? null : localStorage.getItem("mor_admin_token")
  );
  const [email, setEmail] = useState(() =>
    isSupabaseConfigured ? null : localStorage.getItem("mor_admin_email")
  );
  const [isAdmin, setIsAdmin] = useState(() =>
    isSupabaseConfigured ? false : Boolean(localStorage.getItem("mor_admin_token"))
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    async function applySession(session) {
      if (!session) {
        if (active) {
          setToken(null);
          setEmail(null);
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!active) return;

      setToken(session.access_token);
      setEmail(session.user.email || null);
      setIsAdmin(!error && profile?.role === "admin");
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error("Could not restore Supabase session:", error);
      return applySession(data?.session || null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function login(loginEmail, password) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error || !data.session) {
        throw authError(error?.message || "Login failed.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (profileError || profile?.role !== "admin") {
        await supabase.auth.signOut();
        throw authError("This account is not authorized for the admin panel.");
      }

      setToken(data.session.access_token);
      setEmail(data.user.email || loginEmail);
      setIsAdmin(true);
      return;
    }

    const res = await api.post("/auth/login", { email: loginEmail, password });
    localStorage.setItem("mor_admin_token", res.data.token);
    localStorage.setItem("mor_admin_email", res.data.email);
    setToken(res.data.token);
    setEmail(res.data.email);
    setIsAdmin(true);
  }

  async function logout() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem("mor_admin_token");
      localStorage.removeItem("mor_admin_email");
    }

    setToken(null);
    setEmail(null);
    setIsAdmin(false);
  }

  return (
    <AdminAuthContext.Provider
      value={{
        token,
        email,
        login,
        logout,
        loading,
        isAuthenticated: isAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
