import React, { useEffect, useState } from "react";
import api, { uploadProductImage } from "../../api";
import { formatPrice } from "../../config";
import { isSupabaseConfigured } from "../../supabase";

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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    api.get("/categories").then((res) => setCategories(res.data)).catch((err) => {
      setError(err.response?.data?.error || err.message || "Could not load categories.");
    });
  }, []);

  function openNew() {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setError("");
    setShowForm(true);
  }

  function openEdit(p) {
    setForm({ ...p, featured: !!p.featured });
    setImageFile(null);
    setImagePreview(p.image_url || "");
    setError("");
    setShowForm(true);
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setImageFile(null);
      return;
    }

    if (!Object.prototype.hasOwnProperty.call({
      "image/jpeg": true,
      "image/png": true,
      "image/webp": true,
    }, file.type)) {
      setError("Use a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Product images must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      await loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not delete product.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = { ...form, price: Number(form.price), category_id: Number(form.category_id) };
      let saved;

      if (form.id) {
        if (imageFile) payload.image_url = await uploadProductImage(imageFile, form.id);
        saved = await api.put(`/products/${form.id}`, payload);
      } else {
        saved = await api.post("/products", payload);
        if (imageFile && saved.data?.id) {
          const imageUrl = await uploadProductImage(imageFile, saved.data.id);
          await api.put(`/products/${saved.data.id}`, { ...saved.data, image_url: imageUrl });
        }
      }

      setShowForm(false);
      setImageFile(null);
      setImagePreview("");
      await loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="page-title">Products</h1>
        <button className="btn" onClick={openNew}>
          + Add Product
        </button>
      </div>

      {error && <div className="error-text" role="alert" style={{ marginBottom: 20 }}>{error}</div>}

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
              {isSupabaseConfigured && (
                <>
                  <label htmlFor="product-image-file" style={{ marginTop: 14 }}>Or upload an image</label>
                  <input
                    id="product-image-file"
                    className="form-control"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                  />
                  <small className="image-upload-help">JPG, PNG, or WebP up to 5 MB.</small>
                  {imagePreview && (
                    <img className="admin-image-preview" src={imagePreview} alt="Product preview" />
                  )}
                </>
              )}
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

          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving..." : form.id ? "Update Product" : "Create Product"}
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

      <div className="admin-table-wrap">
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
          {loading && (
            <tr><td colSpan="7" className="empty-state">Loading products...</td></tr>
          )}
          {!loading && products.length === 0 && (
            <tr><td colSpan="7" className="empty-state">No products yet. Add the first catalogue item above.</td></tr>
          )}
          {!loading && products.map((p) => (
            <tr key={p.id}>
              <td>
                {p.image_url ? <img src={p.image_url} alt={p.name} /> : <span aria-label="No image">—</span>}
              </td>
              <td>{p.name}</td>
              <td>{p.category_name}</td>
              <td style={{ textTransform: "capitalize" }}>{p.gender}</td>
              <td>{formatPrice(p.price)}</td>
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
    </div>
  );
}
