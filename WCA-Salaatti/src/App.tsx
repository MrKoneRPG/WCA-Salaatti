import { useEffect, useState } from 'react'
import './App.css'
import type { ProductData } from './types/ProductData'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// The salad bar always has 2 rows, so these are the size options:
// 4 = 2 + 2, 6 = 3 + 3, 8 = 4 + 4, 10 = 5 + 5, 12 = 6 + 6
const SIZE_TEMPLATES = [4, 6, 8, 10, 12]
const MAX_SLOTS = 12
const SKELETON_COUNT = 6 // grey placeholder cards shown while loading

function App() {
  const [products, setProducts] = useState<ProductData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)

  
  const [selected, setSelected] = useState<ProductData | null>(null)
  const [slots, setSlots] = useState<(ProductData | null)[]>([null, null, null, null])
  const [showProducts, setShowProducts] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      try {
        const response = await fetch(`${API_URL}/api/products`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Request failed: ${response.status}`)
        const data: ProductData[] = await response.json()
        setProducts(data)
      } catch (err) {
        if (controller.signal.aborted) return
        console.error(err)
        setLoadError('Could not load products. Is the backend running?')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadProducts()
    return () => controller.abort()
  }, [reloadCount])

  function retryLoad() {
    setLoadError('')
    setIsLoading(true)
    setReloadCount((count) => count + 1)
  }

  // Click a product: pick it up, or put it down if it was already picked
  function selectProduct(product: ProductData) {
    if (selected?.productCode === product.productCode) {
      setSelected(null)
    } else {
      setSelected(product)
    }
  }

  // Click a slot: put the selected product there
  function placeInSlot(index: number) {
    if (!selected) return
    setSlots(slots.map((slot, i) => (i === index ? selected : slot)))
  }

  function clearSlot(index: number) {
    setSlots(slots.map((slot, i) => (i === index ? null : slot)))
  }

  // Change the bar to a new size. Products already placed keep their spot.
  function resizeBar(newSize: number) {
    const resized = []
    for (let i = 0; i < newSize; i++) {
      resized.push(slots[i] ?? null)
    }
    setSlots(resized)
  }

  function addColumn() {
    if (slots.length < MAX_SLOTS) {
      resizeBar(slots.length + 2)
    }
  }

  const columns = slots.length / 2

  return (
    <>
      <header className="site-header">
        <h1>Salad bar planner</h1>
        <nav>
          <a href="#" className="active">Builder</a>
          <a href="#">Saved examples</a>
        </nav>
      </header>

      <main className={showProducts ? 'layout' : 'layout products-hidden'}>
        <aside className="column products">
          <div className="column-header">
            {showProducts && <h2>Products</h2>}
            <button
              type="button"
              className="toggle-products"
              onClick={() => setShowProducts(!showProducts)}
              title={showProducts ? 'Hide products' : 'Show products'}
            >
              {showProducts ? '‹' : '›'}
            </button>
          </div>

          {showProducts && (
            <>
              {isLoading && (
                <>
                  <p className="loading-state" role="status">
                    <span className="spinner" aria-hidden="true" />
                    Loading products…
                  </p>
                  <ul className="product-grid" aria-hidden="true">
                    {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                      <li key={i} className="product-card skeleton">
                        <div className="skeleton-image" />
                        <div className="skeleton-text" />
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {loadError && (
                <div role="alert">
                  <p>{loadError}</p>
                  <button type="button" onClick={retryLoad}>
                    Try again
                  </button>
                </div>
              )}

              {!isLoading && !loadError && products.length === 0 && (
                <p>No products found.</p>
              )}

              {products.length > 0 && (
                <ul className="product-grid">
                  {products.map((entry) => (
                    <li
                      key={entry.productCode}
                      className={
                        selected?.productCode === entry.productCode
                          ? 'product-card selected'
                          : 'product-card'
                      }
                      onClick={() => selectProduct(entry)}
                    >
                      {entry.imageUrl ? (
                        <img src={entry.imageUrl} alt={entry.productName} />
                      ) : (
                        <div className="no-image">{entry.productName.charAt(0)}</div>
                      )}
                      <span>{entry.productName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </aside>

        {/* MIDDLE: salad bar */}
        <section className="column salad-bar">
          <div className="column-header">
            <h2>Salad bar</h2>

            <div className="bar-sizes">
              {SIZE_TEMPLATES.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={slots.length === size ? 'size-button active' : 'size-button'}
                  onClick={() => resizeBar(size)}
                  title={`${size / 2} + ${size / 2}`}
                >
                  {size}
                </button>
              ))}
              <button
                type="button"
                className="size-button"
                onClick={addColumn}
                disabled={slots.length >= MAX_SLOTS}
                title="Add one column (2 slots)"
              >
                +
              </button>
            </div>
          </div>

          <p className="salad-bar-hint">
            {selected
              ? `Holding: ${selected.productName} – click a slot to place it`
              : 'Click a product on the left, then click a slot'}
          </p>

          {/* Always 2 rows; the number of columns follows the slot count */}
          <div
            className="slot-grid"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {slots.map((product, index) => (
              <div
                key={index}
                className={product ? 'slot filled' : 'slot'}
                onClick={() => placeInSlot(index)}
              >
                <span className="slot-number">{index + 1}</span>

                {product ? (
                  <>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.productName} />
                    ) : (
                      <div className="no-image">{product.productName.charAt(0)}</div>
                    )}
                    <span>{product.productName}</span>
                    <button
                      type="button"
                      className="slot-clear"
                      onClick={(e) => {
                        e.stopPropagation()
                        clearSlot(index)
                      }}
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <span className="slot-empty">Empty</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT: cost accounting */}
        <aside className="column costs">
          <h2>Cost accounting</h2>
        </aside>
      </main>
    </>
  )
}

export default App