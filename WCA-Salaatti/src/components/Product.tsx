import type { ProductData } from "../types/ProductData";

type ProductProps = {
  entry: ProductData;
};

function ProductInfo({ entry}: ProductProps) {
  return (
    <article>
      <h2>{entry.name}</h2>
      <p>{entry.category}</p>
      <p>{entry.gnsize}</p>
      <p>{entry.price}</p>
    </article>
  );
}

export default ProductInfo;