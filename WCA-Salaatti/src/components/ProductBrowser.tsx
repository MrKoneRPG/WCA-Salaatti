import { useState } from "react";
import type { ProductData } from "../types/ProductData";
import type { Category } from "../types/Category";

type ProductBrowserProps = {
  products: ProductData[];
  categories: Category[];
  onProductSelect?: (productId: number) => void;
};

export default function ProductBrowser({
  products,
  categories,
  onProductSelect,
}: ProductBrowserProps) {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const filteredProducts = products.filter((product) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      product.productName.toLowerCase().includes(searchLower) ||
      String(product.productCode).toLowerCase().includes(searchLower);

    const matchesCategory =
      selectedCategoryId === null || product.categoryId === selectedCategoryId;

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

      <div className="category-buttons">
        <button
          type="button"
          className={selectedCategoryId === null ? "category-button active" : "category-button"}
          onClick={() => setSelectedCategoryId(null)}
        >
          All
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={
              selectedCategoryId === category.id ? "category-button active" : "category-button"
            }
            onClick={() => setSelectedCategoryId(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <p className="no-results">No products match the current filters.</p>
      )}

      <ul className="product-grid">
        {filteredProducts.map((product) => (
          <li
            key={product.id}
            className="product-card"
            onClick={() => onProductSelect?.(product.id)}
          >
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.productName} />
            ) : (
              <div className="no-image">{product.productName.charAt(0)}</div>
            )}

            <span>{product.productName}</span>
          </li>
        ))}
      </ul>
    </>
  );
}