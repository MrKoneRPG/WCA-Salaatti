import { useState } from 'react'
import './App.css'
import type { ProductData } from './types/ProductData'
import Product from './components/Product'

// The salad bar always has 2 rows, so these are the size options:
// 4 = 2 + 2, 6 = 3 + 3, 8 = 4 + 4, 10 = 5 + 5, 12 = 6 + 6
const SIZE_TEMPLATES = [4, 6, 8, 10, 12]
const MAX_SLOTS = 12

function App() {
  const [entries] = useState<ProductData[]>([])
  const [serverEntries, setServerEntries] = useState<ProductData[]>([])
  const [loadError, setLoadError] = useState('')

  // The product you're currently "holding"
  const [selected, setSelected] = useState<ProductData | null>(null)
  // The salad bar slots. null = empty slot. Starts as 4 (2 + 2).
  const [slots, setSlots] = useState<(ProductData | null)[]>([null, null, null, null])
  // Is the Products column open?
  const [showProducts, setShowProducts] = useState(true)

  async function loadServerEntries() {
    setLoadError('')
    try {
      const response = await fetch('http://localhost:3001/api/products')
      if (!response.ok) throw new Error('Could not load entries')
      const data: ProductData[] = await response.json()
      // The backend sends the picture as "image", our type calls it "imageUrl"
      setServerEntries(
        data.map((product) => ({
          ...product,
          imageUrl: product.imageUrl ?? (product as unknown as { image: string }).image,
        })),
      )
    } catch {
      setLoadError('Could not connect to the backend.')
    }
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

  // Change the bar to a new size. Products already placed keep their spot;
  // if the bar gets smaller, the slots at the end are removed.
  function resizeBar(newSize: number) {
    const resized = []
    for (let i = 0; i < newSize; i++) {
      resized.push(slots[i] ?? null)
    }
    setSlots(resized)
  }

  // + adds one column = 2 slots (one on top, one below)
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
        {/* LEFT: products (can be hidden) */}
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
              {entries.map((entry) => (
                <Product key={entry.productCode} entry={entry} />
              ))}

              <button type="button" onClick={loadServerEntries}>
                Load from backend
              </button>
              {loadError && <p>{loadError}</p>}

              <ul className="product-grid">
                {serverEntries.map((entry) => (
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
            </>
          )}
        </aside>

        {/* MIDDLE: salad bar */}
        <section className="column salad-bar">
          <div className="column-header">
            <h2>Salad bar</h2>

            {/* Size templates + add-column button */}
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
                        e.stopPropagation() // don't also trigger the slot's own click
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