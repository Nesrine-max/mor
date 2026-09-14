import React, { useEffect, useState } from "react";
import api from "../../api";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data));
    api.get("/categories").then((res) => setCategories(res.data));
  }, []);

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const featuredCount = products.filter((p) => p.featured).length;

  return (
    <div>
      <div className="admin-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

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
      </div>

      <h2 className="section-title" style={{ textAlign: "left", fontSize: 22 }}>
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
              <td>${Number(p.price).toFixed(2)}</td>
              <td>{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}