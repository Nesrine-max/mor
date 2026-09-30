import React, { useEffect, useState } from "react";
import api from "../../api";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("women");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, { name, gender: type });
      } else {
        await api.post("/categories", { name, gender: type });
      }
      setName("");
      setType("women");
      setEditingId(null);
      await loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not save category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this category? Its products will also be removed.")) return;
    try {
      await api.delete(`/categories/${id}`);
      await loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not delete category.");
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setName(c.name);
    setType(c.gender || "women");
  }

  const filteredCategories = filter === "all" ? categories : categories.filter((c) => c.gender === filter);

  const genderLabel = (gender) => {
    if (gender === "women") return "Women";
    if (gender === "men") return "Men";
    if (gender === "home") return "Home Stuff";
    return gender;
  };

  return (
    <div>
      <div className="admin-header">
        <h1 className="page-title">Categories</h1>
      </div>

      {error && <div className="error-text" role="alert" style={{ marginBottom: 20 }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, marginBottom: 30, maxWidth: 500 }}>
        <select
          className="form-control"
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
        >
          <option value="women">Women</option>
          <option value="men">Men</option>
          <option value="home">Home Stuff</option>
        </select>
        <input
          className="form-control"
          placeholder="e.g. Suits & Sets"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Saving..." : editingId ? "Update" : "Add"}
        </button>
        {editingId && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setEditingId(null);
              setName("");
              setType("women");
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["all", "women", "men", "home"].map((g) => (
          <button
            key={g}
            className={`btn ${filter === g ? "" : "btn-outline"}`}
            onClick={() => setFilter(g)}
          >
            {g === "all" ? "All" : genderLabel(g)}
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan="3" className="empty-state">Loading categories...</td></tr>}
          {!loading && filteredCategories.length === 0 && (
            <tr><td colSpan="3" className="empty-state">No categories yet. Add the first one above.</td></tr>
          )}
          {!loading && filteredCategories.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{genderLabel(c.gender)}</td>
              <td>
                <button className="icon-btn" onClick={() => startEdit(c)}>
                  Edit
                </button>
                <button className="icon-btn" onClick={() => handleDelete(c.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
