import type { ProductData } from '../types/ProductData'

type ProductProps = {
  entry: ProductData
}

function Product({ entry }: ProductProps) {
  return (
    <article>
      <h3>{entry.name}</h3>
      <p>{entry.category} · {entry.gnsize} · {entry.price.toFixed(2)} €</p>
    </article>
  )
}

export default Product