import React, { useEffect, useState } from "react";
import api from "../../api";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);

  function loadCategories() {
    api.get("/categories").then((res) => setCategories(res.data));
  }

  useEffect(loadCategories, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      await api.put(`/categories/${editingId}`, { name });
    } else {
      await api.post("/categories", { name });
    }
    setName("");
    setEditingId(null);
    loadCategories();
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this category? Its products will also be removed.")) return;
    await api.delete(`/categories/${id}`);
    loadCategories();
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

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, marginBottom: 30, maxWidth: 500 }}>
        <input
          className="form-control"
          placeholder="e.g. Suits & Sets"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn" type="submit">
          {editingId ? "Update" : "Add"}
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

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
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
  );
}