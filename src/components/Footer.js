import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4 className="logo brand-mor" style={{ fontSize: 24 }}>
              Mor
            </h4>
            <p>Contemporary essentials for men and women. Designed to last, made to move.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <Link to="/shop/women">Women</Link>
            <Link to="/shop/men">Men</Link>
            <Link to="/shop/home">Home Stuff</Link>
          </div>
          <div>
            <h4>Help</h4>
            <a href="#!">Shipping</a>
            <a href="#!">Returns</a>
            <a href="#!">Size Guide</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="#!">About <span className="brand-mor">Mor</span></a>
            <a href="#!">Contact</a>
            <Link to="/admin/login">Admin</Link>
          </div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} <span className="brand-mor">Mor</span>. All rights reserved.</div>
      </div>
    </footer>
  );
}