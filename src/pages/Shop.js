import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api"; // Correct relative path from pages folder to src/api.js

const Shop = () => {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch products filtered by category or all products if no category is selected
        const endpoint = categoryName
          ? `/products?category=${categoryName}`
          : "/products";
        const response = await api.get(endpoint);
        
        setProducts(response.data);
      } catch (err) {
        console.error("Error fetching category products:", err);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [categoryName]);

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{categoryName ? `${categoryName} Products` : "All Products"}</h2>
      <div className="product-grid">
        {products.length === 0 ? (
          <p>No products found in this category.</p>
        ) : (
          products.map((product) => (
            <div key={product.id} className="product-card">
              <img src={product.image_url} alt={product.name} />
              <h3>{product.name}</h3>
              <p>${product.price}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Shop;