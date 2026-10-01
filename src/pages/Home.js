import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import ProductCard from "../components/ProductCard";

const GENDERS = [
  { key: "women", label: "Women" },
  { key: "men", label: "Men" },
  { key: "home", label: "Home Stuff" },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api
      .get("/products", { params: { featured: 1 } })
      .then((res) => {
        setFeatured(Array.isArray(res.data) ? res.data.slice(0, 8) : []);
        setCatalogLoading(false);
      })
      .catch((err) => {
        console.error("Error loading featured products:", err);
        setFeatured([]);
        setCatalogLoading(false);
        setCatalogError("Featured products will appear once the catalogue is connected.");
      });
  }, []);

  useEffect(() => {
    api
      .get("/categories")
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategories([]));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">New Season</div>
          <h1 className="hero-title">Wear the moment.</h1>
          <p className="hero-text">
            <span className="brand-mor">Mor</span> is contemporary clothing built for everyday movement — clean lines, rich tones,
            made for men and women who don't follow trends.
          </p>
          <Link to="/shop/women" className="btn">
            Shop the Collection
          </Link>
        </div>
      </section>

      <section className="container">
        <h2 className="section-title">Shop by Category</h2>
        <p className="section-subtitle">Curated staples, season after season</p>
        <div className="category-grid">
          {GENDERS.map((g) => {
            const groupCategories = categories.filter((c) => c.gender === g.key);
            if (groupCategories.length === 0) return null;
            return groupCategories.map((c) => (
              <Link key={c.slug} to={`/shop/${g.key}?category=${c.slug}`} className="category-card">
                <div className="category-card-label">{c.name}</div>
              </Link>
            ));
          })}
        </div>
      </section>

      <section className="container">
        <h2 className="section-title">Featured Pieces</h2>
        <p className="section-subtitle">Hand-picked for the new season</p>
        {catalogError && <div className="empty-state error-state">{catalogError}</div>}
        {!catalogError && catalogLoading && <div className="empty-state">Loading featured pieces...</div>}
        {!catalogError && !catalogLoading && featured.length === 0 && (
          <div className="empty-state">Featured pieces will appear here soon.</div>
        )}
        {featured.length > 0 && (
          <div className="product-grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
