import { useState } from "react";
import type { ProductData } from "../types/ProductData";

type ProductBrowserProps = {
  products: ProductData[];
  onProductSelect?: (productId: number) => void;
};

export default function ProductBrowser({
  products,
  onProductSelect,
}: ProductBrowserProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = [...new Set(products.map((p) => p.category))].sort();

  const filteredProducts = products.filter((product) => {
    const searchLower = search.toLowerCase();

    const matchesSearch =
      product.productName.toLowerCase().includes(searchLower) ||
      String(product.productCode)
        .toLowerCase()
        .includes(searchLower);

    const matchesCategory =
      selectedCategory === "" ||
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <input
        type="search"
        className="product-search"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select
        className="category-select"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="">All categories</option>

        {categories.map((category) => (
          <option
            key={category}
            value={category}
          >
            {category}
          </option>
        ))}
      </select>

      {filteredProducts.length === 0 && (
        <p className="no-results">
          No products match the current filters.
        </p>
      )}

      <ul className="product-grid">
        {filteredProducts.map((product) => (
          <li
            key={product.id}
            className="product-card"
            onClick={() => onProductSelect?.(product.id)}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.productName}
              />
            ) : (
              <div className="no-image">
                {product.productName.charAt(0)}
              </div>
            )}

            <span>{product.productName}</span>
          </li>
        ))}
      </ul>
    </>
  );
}