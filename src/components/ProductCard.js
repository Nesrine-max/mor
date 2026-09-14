import React from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "../config";

export default function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-image-wrap">
        <img src={product.image_url} alt={product.name} />
      </div>
      <div className="product-info">
        <div className="product-category">{product.category_name}</div>
        <div className="product-name">{product.name}</div>
        <div className="product-price">{formatPrice(product.price)}</div>
      </div>
    </Link>
  );
}
