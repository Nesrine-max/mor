import React, { useEffect, useState } from "react";
import api from "../../api";

const EMPTY_FORM = {
  id: null,
  name: "",
  description: "",
  price: "",
  image_url: "",
  gender: "unisex",
  category_id: "",
  stock: 0,
  sizes: "S,M,L,XL",
  featured: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  function loadProducts() {
    api.get("/products").then((res) => setProducts(res.data));
  }

  useEffect(() => {
    loadProducts();
    api.get("/categories").then((res) => setCategories(res.data));
  }, []);

  function openNew() {
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(p) {
    setForm({ ...p, featured: !!p.featured });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this product?")) return;
    await api.delete(`/products/${id}`);
    loadProducts();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), category_id: Number(form.category_id) };

    if (form.id) {
      await api.put(`/products/${form.id}`, payload);
    } else {
      await api.post("/products", payload);
    }
    setShowForm(false);
    loadProducts();
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="page-title">Products</h1>
        <button className="btn" onClick={openNew}>
          + Add Product
        </button>
      </div>

      {showForm && (
        <form
          className="stat-card"
          style={{ marginBottom: 30, display: "block", padding: 28 }}
          onSubmit={handleSubmit}
        >
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input
                className="form-control"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Price ($)</label>
              <input
                className="form-control"
                type="number"
                step="0.01"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                className="form-control"
                required
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select
                className="form-control"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="unisex">Unisex / Sportswear</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Image URL</label>
              <input
                className="form-control"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input
                className="form-control"
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Sizes (comma separated)</label>
              <input
                className="form-control"
                value={form.sizes}
                onChange={(e) => setForm({ ...form, sizes: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Featured</label>
              <select
                className="form-control"
                value={form.featured ? "1" : "0"}
                onChange={(e) => setForm({ ...form, featured: e.target.value === "1" })}
              >
                <option value="0">No</option>
                <option value="1">Yes</option>
              </select>
            </div>
          </div>

          <button className="btn" type="submit">
            {form.id ? "Update Product" : "Create Product"}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ marginLeft: 10 }}
            onClick={() => setShowForm(false)}
          >
            Cancel
          </button>
        </form>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Category</th>
            <th>Gender</th>
            <th>Price</th>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <img src={p.image_url} alt={p.name} />
              </td>
              <td>{p.name}</td>
              <td>{p.category_name}</td>
              <td style={{ textTransform: "capitalize" }}>{p.gender}</td>
              <td>${Number(p.price).toFixed(2)}</td>
              <td>{p.stock}</td>
              <td>
                <button className="icon-btn" onClick={() => openEdit(p)}>
                  Edit
                </button>
                <button className="icon-btn" onClick={() => handleDelete(p.id)}>
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