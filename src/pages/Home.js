import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import ProductCard from "../components/ProductCard";

const FEATURED_CATEGORIES = [
  { slug: "t-shirts", name: "T-Shirts", img: "https://picsum.photos/seed/mor-tshirts/600/750" },
  { slug: "jackets-and-coats", name: "Jackets & Coats", img: "https://picsum.photos/seed/mor-jackets/600/750" },
  { slug: "sportswear", name: "Sportswear", img: "https://picsum.photos/seed/mor-sport/600/750" },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get("/products", { params: { featured: 1 } }).then((res) => setFeatured(res.data.slice(0, 8)));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">New Season</div>
          <h1 className="hero-title">Wear the moment.</h1>
          <p className="hero-text">
            Mor is contemporary clothing built for everyday movement — clean lines, rich tones,
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
          {FEATURED_CATEGORIES.map((c) => (
            <Link key={c.slug} to={`/shop/women?category=${c.slug}`} className="category-card">
              <img src={c.img} alt={c.name} />
              <div className="category-card-label">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container">
        <h2 className="section-title">Featured Pieces</h2>
        <p className="section-subtitle">Hand-picked for the new season</p>
        <div className="product-grid">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}