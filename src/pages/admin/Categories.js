import React, { useEffect, useState } from "react";
import api from "../../api";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
        await api.put(`/categories/${editingId}`, { name });
      } else {
        await api.post("/categories", { name });
      }
      setName("");
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
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="page-title">Categories</h1>
      </div>

      {error && <div className="error-text" role="alert" style={{ marginBottom: 20 }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, marginBottom: 30, maxWidth: 500 }}>
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
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan="3" className="empty-state">Loading categories...</td></tr>}
          {!loading && categories.length === 0 && (
            <tr><td colSpan="3" className="empty-state">No categories yet. Add the first one above.</td></tr>
          )}
          {!loading && categories.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.slug}</td>
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
