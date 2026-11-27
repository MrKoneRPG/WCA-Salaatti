import { useState } from 'react'
import './App.css'
import type { ProductData } from './types/ProductData'
import Product from './components/Product'
import ProductBrowser from './components/ProductBrowser'

const SIZE_TEMPLATES = [10, 15]
const DEFAULT_SIZE = 10
const MIN_SLOTS = 2
const MAX_SLOTS = 30

const PRODUCTS_WIDTH = '260px'
const COSTS_WIDTH = '300px'
const COLLAPSED_WIDTH = '62px'

function App() {
  const [entries] = useState<ProductData[]>([])
  const [serverEntries, setServerEntries] = useState<ProductData[]>([])
  const [loadError, setLoadError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [selected, setSelected] = useState<ProductData | null>(null)
  const [slots, setSlots] = useState<(ProductData | null)[]>(Array(DEFAULT_SIZE).fill(null))
  const [sizeInput, setSizeInput] = useState(String(DEFAULT_SIZE))
  const [showProducts, setShowProducts] = useState(true)
  const [showCosts, setShowCosts] = useState(true)

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
      setLoaded(true)
    } catch {
      setLoadError('Could not connect to the backend.')
    }
  }

  function selectProduct(product: ProductData) {
    setSelected(selected === product ? null : product)
  }

  function placeInSlot(index: number) {
    if (!selected) return
    setSlots(slots.map((slot, i) => (i === index ? selected : slot)))
    setSelected(null)
  }

  function clearSlot(index: number) {
    setSlots(slots.map((slot, i) => (i === index ? null : slot)))
  }

  // Products keep their spot; shrinking removes slots from the end
  function resizeBar(newSize: number) {
    const size = Math.min(MAX_SLOTS, Math.max(MIN_SLOTS, Math.round(newSize)))
    const resized = []
    for (let i = 0; i < size; i++) {
      resized.push(slots[i] ?? null)
    }
    setSlots(resized)
    setSizeInput(String(size))
  }

  function applySizeInput() {
    const value = Number(sizeInput)
    if (sizeInput.trim() === '' || Number.isNaN(value)) {
      setSizeInput(String(slots.length))
      return
    }
    resizeBar(value)
  }

  // 2 rows; odd sizes put the extra slot on the top row
  const columns = Math.ceil(slots.length / 2)

  const layoutColumns = [
    showProducts ? PRODUCTS_WIDTH : COLLAPSED_WIDTH,
    'minmax(0, 1fr)',
    showCosts ? COSTS_WIDTH : COLLAPSED_WIDTH,
  ].join(' ')

  return (
    <>
      <header className="site-header">
        <h1>Salad bar planner</h1>
        <nav>
          <a href="#" className="active">Builder</a>
          <a href="#">Saved examples</a>
        </nav>
      </header>

      <main className="layout" style={{ gridTemplateColumns: layoutColumns }}>
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

              {!loaded ? (
                <>
                  <button type="button" onClick={loadServerEntries}>
                    Load from backend
                  </button>
                  {loadError && <p>{loadError}</p>}
                </>
              ) : 

              <ProductBrowser
                products={serverEntries}
                onProductSelect={(productId) => {
                const product = serverEntries.find(
                (p) => p.id === productId
                  );

                 if (product) {
                selectProduct(product);
               }
               }}
              />
              }</>
          )}
        </aside>

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
                  title={`${Math.ceil(size / 2)} + ${Math.floor(size / 2)}`}
                >
                  {size}
                </button>
              ))}

              <button
                type="button"
                className="size-button"
                onClick={() => resizeBar(slots.length - 1)}
                disabled={slots.length <= MIN_SLOTS}
                title="Remove one slot"
              >
                −
              </button>
              <input
                type="number"
                className="size-input"
                min={MIN_SLOTS}
                max={MAX_SLOTS}
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onBlur={applySizeInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applySizeInput()
                }}
                title={`Own size (${MIN_SLOTS}–${MAX_SLOTS})`}
              />
              <button
                type="button"
                className="size-button"
                onClick={() => resizeBar(slots.length + 1)}
                disabled={slots.length >= MAX_SLOTS}
                title="Add one slot"
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

        <aside className="column costs">
                    <div className="column-header">
            <button
              type="button"
              className="toggle-products"
              onClick={() => setShowCosts(!showCosts)}
              title={showCosts ? 'Hide cost accounting' : 'Show cost accounting'}
            >
              {showCosts ? '›' : '‹'}
            </button>
            {showCosts && <h2>Cost accounting</h2>}
          </div>

          {showCosts && <>{/* cost accounting content goes here */}</>}
        </aside>
      </main>
    </>
  )
}

export default App