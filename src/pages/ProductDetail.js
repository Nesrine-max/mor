import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import { useCart } from "../context/CartContext";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [size, setSize] = useState(null);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => {
      setProduct(res.data);
      const sizes = (res.data.sizes || "").split(",").filter(Boolean);
      setSize(sizes[0]);
    });
  }, [id]);

  if (!product) return <div className="empty-state">Loading...</div>;

  const sizes = (product.sizes || "").split(",").filter(Boolean);

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
          <div className="product-detail-price">${Number(product.price).toFixed(2)}</div>
          <p className="product-detail-desc">{product.description}</p>

          <div>
            <div className="form-group">
              <label>Select Size</label>
              <div className="size-selector">
                {sizes.map((s) => (
                  <div
                    key={s}
                    className={`size-box ${size === s ? "active" : ""}`}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </div>
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