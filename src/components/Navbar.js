import React, { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import api from "../api";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const [categories, setCategories] = useState([]);
  const { count } = useCart();

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="logo">
          M<span>O</span>R
        </Link>

        <nav className="nav-links">
          <div className="nav-item-has-menu" style={{ position: "relative" }}>
            <NavLink to="/shop/women" className={({ isActive }) => (isActive ? "active" : "")}>
              Women
            </NavLink>
            <div className="mega-menu">
              <div className="mega-menu-inner">
                {categories.map((c) => (
                  <Link key={c.id} to={`/shop/women?category=${c.slug}`}>
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="nav-item-has-menu" style={{ position: "relative" }}>
            <NavLink to="/shop/men" className={({ isActive }) => (isActive ? "active" : "")}>
              Men
            </NavLink>
            <div className="mega-menu">
              <div className="mega-menu-inner">
                {categories.map((c) => (
                  <Link key={c.id} to={`/shop/men?category=${c.slug}`}>
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <NavLink to="/shop/unisex" className={({ isActive }) => (isActive ? "active" : "")}>
            Sportswear
          </NavLink>
        </nav>

        <div className="nav-icons">
          <Link to="/cart" className="cart-badge">
            Bag
            {count > 0 && <span className="cart-count">{count}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}