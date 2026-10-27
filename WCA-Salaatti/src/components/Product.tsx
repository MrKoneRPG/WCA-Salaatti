import type { ProductData } from '../types/ProductData'

type ProductProps = {
  entry: ProductData
}

function Product({ entry }: ProductProps) {
  return (
    <article>
      {entry.imageUrl ? (
        <img src={entry.imageUrl} alt={entry.name} width={160} />
      ) : (
        <p>No image</p>
      )}
      <h3>{entry.name}</h3>
      <p>{entry.category} · {entry.gnsize} · {entry.price.toFixed(2)} €</p>
      <p>Code: {entry.productCode} · EAN: {entry.ean}</p>
    </article>
  )
}

export default Product