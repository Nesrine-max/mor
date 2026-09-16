import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mor_cart")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("mor_cart", JSON.stringify(items));
  }, [items]);

  function addToCart(product, size, qty = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id && i.size === size);
      const availableStock = Number(product.stock ?? product.stock_quantity);
      const requestedQty = existing ? existing.qty + Number(qty) : Number(qty);
      const nextQty = Number.isFinite(availableStock) && availableStock > 0
        ? Math.min(requestedQty, availableStock)
        : requestedQty;

      if (existing) {
        return prev.map((i) =>
          i.id === product.id && i.size === size ? { ...i, qty: nextQty } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image_url: product.image_url,
          size,
          stock: Number.isFinite(availableStock) ? availableStock : null,
          qty: nextQty,
        },
      ];
    });
  }

  function updateQty(id, size, qty) {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => !(i.id === id && i.size === size))
        : prev.map((i) => {
            if (i.id !== id || i.size !== size) return i;
            const maxQty = Number(i.stock);
            const nextQty = Number.isFinite(maxQty) && maxQty > 0 ? Math.min(qty, maxQty) : qty;
            return { ...i, qty: nextQty };
          })
    );
  }

  function removeFromCart(id, size) {
    setItems((prev) => prev.filter((i) => !(i.id === id && i.size === size)));
  }

  function clearCart() {
    setItems([]);
  }

  const total = items.reduce((sum, i) => sum + Number(i.price) * Number(i.qty), 0);
  const count = items.reduce((sum, i) => sum + Number(i.qty), 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, updateQty, removeFromCart, clearCart, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
