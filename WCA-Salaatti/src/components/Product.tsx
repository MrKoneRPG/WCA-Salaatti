import type { ProductData } from '../types/ProductData'

type ProductProps = {
  entry: ProductData
}

function Product({ entry }: ProductProps) {
  return (
    <article>
      {entry.imageUrl && (
        <img src={entry.imageUrl} alt={entry.productName} loading="lazy" />
      )}
      <h3>{entry.productName}</h3>
      <p>{entry.GnSize} · {entry.price.toFixed(2)} €</p>
    </article>
  )
}

export default Product