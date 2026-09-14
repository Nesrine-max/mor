import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../config";

function parseSizes(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [size, setSize] = useState(null);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => {
      setProduct(res.data);
      const sizes = parseSizes(res.data.sizes);
      setSize(sizes[0]);
    });
  }, [id]);

  if (!product) return <div className="empty-state">Loading...</div>;

  const sizes = parseSizes(product.sizes);

  function handleAdd() {
    addToCart(product, size, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="container">
      <div className="product-detail">
        <div className="product-detail-image">
          <img src={product.image_url} alt={product.name} />
        </div>
        <div>
          <div className="product-category">{product.category_name}</div>
          <h1 className="product-detail-name">{product.name}</h1>
          <div className="product-detail-price">{formatPrice(product.price)}</div>
          <p className="product-detail-desc">{product.description}</p>

          <div>
            <div className="form-group">
              <label>Select Size</label>
              <div className="size-selector">
                {sizes.map((s) => (
                    <button
                      type="button"
                      key={s}
                      className={`size-box ${size === s ? "active" : ""}`}
                      onClick={() => setSize(s)}
                  >
                    {s}
                    </button>
                ))}
              </div>
            </div>
          </div>

          <button className="btn" onClick={handleAdd}>
            {added ? "Added to Bag ✓" : "Add to Bag"}
          </button>
        </div>
      </div>
    </div>
  );
}
