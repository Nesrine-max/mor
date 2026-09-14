import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import api from "../api";
import ProductCard from "../components/ProductCard";

const GENDER_LABELS = {
  women: "Women",
  men: "Men",
  unisex: "Sportswear",
};

export default function Shop() {
  const { gender } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProducts() {
      setLoading(true);
      setError(null);

      try {
        const params = {};
        if (gender && gender !== "all") params.gender = gender;
        if (category) params.category = category;

        const response = await api.get("/products", { params });
        if (mounted) setProducts(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        if (mounted) {
          console.error("Error fetching products:", err);
          setError("We could not load these products. Please try again.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProducts();
    return () => {
      mounted = false;
    };
  }, [gender, category]);

  useEffect(() => {
    let mounted = true;

    api
      .get("/categories")
      .then((response) => {
        if (mounted) setCategories(Array.isArray(response.data) ? response.data : []);
      })
      .catch(() => {
        if (mounted) setCategories([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const result = products.filter((product) => {
      if (!normalizedSearch) return true;
      return [product.name, product.category_name, product.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });

    return [...result].sort((a, b) => {
      if (sort === "price-low") return Number(a.price) - Number(b.price);
      if (sort === "price-high") return Number(b.price) - Number(a.price);
      if (sort === "name") return String(a.name).localeCompare(String(b.name));
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
  }, [products, search, sort]);

  function handleCategoryChange(event) {
    const nextCategory = event.target.value;
    const nextParams = new URLSearchParams(searchParams);

    if (nextCategory) nextParams.set("category", nextCategory);
    else nextParams.delete("category");

    setSearchParams(nextParams);
  }

  const title = GENDER_LABELS[gender] || "All products";

  return (
    <main className="container shop-page">
      <div className="shop-heading">
        <div>
          <div className="hero-eyebrow">The collection</div>
          <h1 className="page-title">{title}</h1>
          <p className="section-subtitle shop-subtitle">
            {category ? `${category.replace(/-/g, " ")} pieces` : "Contemporary essentials for everyday movement"}
          </p>
        </div>
        <div className="shop-count">{visibleProducts.length} pieces</div>
      </div>

      <div className="filter-bar" aria-label="Product filters">
        <label className="filter-control">
          <span>Search</span>
          <input
            className="form-control"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search the collection"
          />
        </label>
        <label className="filter-control">
          <span>Category</span>
          <select className="form-control" value={category} onChange={handleCategoryChange}>
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-control">
          <span>Sort</span>
          <select className="form-control" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="featured">Featured</option>
            <option value="name">Name</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </label>
      </div>

      {loading && <div className="empty-state">Loading products...</div>}
      {!loading && error && <div className="empty-state error-state">{error}</div>}
      {!loading && !error && visibleProducts.length === 0 && (
        <div className="empty-state">No products found for these filters.</div>
      )}
      {!loading && !error && visibleProducts.length > 0 && (
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
