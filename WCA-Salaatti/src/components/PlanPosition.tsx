import { useState } from 'react'
import type { ProductData } from '../types/ProductData'
import './selection-components.css'

type PlanPositionProps = {
  positionNumber: number
  selectedProduct: ProductData | null
  onChoose: (positionNumber: number) => void
  onRemove: (positionNumber: number) => void
}

function PlanPosition({
  positionNumber,
  selectedProduct,
  onChoose,
  onRemove,
}: PlanPositionProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const imageUrl = selectedProduct?.imageUrl
  const showImage = Boolean(imageUrl && imageUrl !== failedImageUrl)

  return (
    <section className="plan-position" aria-label={`Position ${positionNumber}`}>
      <span className="plan-position-number">{positionNumber}</span>
      {selectedProduct ? (
        <>
          {showImage ? (
            <img
              className="plan-position-image"
              src={imageUrl}
              alt={selectedProduct.productName}
              onError={() => setFailedImageUrl(imageUrl ?? null)}
            />
          ) : (
            <div className="plan-position-image-fallback" aria-label="Image unavailable">
              No image
            </div>
          )}
          <span className="plan-position-product-name">{selectedProduct.productName}</span>
          <div className="plan-position-actions">
            <button type="button" onClick={() => onChoose(positionNumber)}>
              Change
            </button>
            <button type="button" onClick={() => onRemove(positionNumber)}>
              Remove
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="plan-position-empty">Empty</span>
          <button type="button" onClick={() => onChoose(positionNumber)}>
            Add
          </button>
        </>
      )}
    </section>
  )
}

export default PlanPosition