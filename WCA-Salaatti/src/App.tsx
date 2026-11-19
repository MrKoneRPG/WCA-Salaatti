import { useState } from 'react'
import './App.css'
import type { ProductData } from './types/ProductData'
import Product from './components/Product'

// 2 rows; odd sizes put the extra slot on top (15 = 8 + 7)
const SIZE_TEMPLATES = [10, 15]
const DEFAULT_SIZE = SIZE_TEMPLATES[0]
const MIN_SLOTS = 2
const MAX_SLOTS = 20
// Placeholder until the backend provides real categories (ProductData.category)
const CATEGORIES = ['Salads', 'Vegetables', 'Fruits', 'Proteins', 'Grains & pasta', 'Dressings']

// From this size up, slots are narrow: long words wrap instead of getting …
const WRAP_NAMES_FROM = 15
const SIZE_OPTIONS = Array.from(
  { length: MAX_SLOTS - MIN_SLOTS + 1 },
  (_, i) => MIN_SLOTS + i,
)

// listKey: unique per loaded product, used for React keys and selection,
// because productCode can repeat or be missing in the backend data
type LoadedProduct = ProductData & { listKey: number }
type PlacedProduct = LoadedProduct & { positionNumber: number }

// One word per line; a single word too wide for its box ends in …
function ProductName({ name }: { name: string }) {
  return (
    <span className="product-name" title={name} lang="fi">
      {name.split(/\s+/).filter(Boolean).map((word, i) => (
        <span key={i}>{word}</span>
      ))}
    </span>
  )
}

function App() {
  const [entries] = useState<ProductData[]>([])
  const [serverEntries, setServerEntries] = useState<LoadedProduct[]>([])
  const [loadError, setLoadError] = useState('')
  const [loaded, setLoaded] = useState(false)

  const [selected, setSelected] = useState<LoadedProduct | null>(null)
  const [slots, setSlots] = useState<(PlacedProduct | null)[]>(
    Array(DEFAULT_SIZE).fill(null),
  )
  const [showProducts, setShowProducts] = useState(true)
  const [showCosts, setShowCosts] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  async function loadServerEntries() {
    setLoadError('')
    try {
      const response = await fetch('http://localhost:3001/api/products')
      if (!response.ok) throw new Error('Could not load entries')
      const data: ProductData[] = await response.json()
      // Backend sends "image", our type uses "imageUrl"
      setServerEntries(
        data.map((product, index) => ({
          ...product,
          listKey: index,
          imageUrl: product.imageUrl ?? (product as unknown as { image: string }).image,
        })),
      )
      setLoaded(true)
    } catch {
      setLoadError('Could not connect to the backend.')
    }
  }

  function selectProduct(product: LoadedProduct) {
    if (selected?.listKey === product.listKey) {
      setSelected(null)
    } else {
      setSelected(product)
    }
  }

  // positionNumber = order of placement (1, 2, 3...). Replacing a product keeps
  // the slot's number; an empty slot gets the lowest number not in use.
  function placeInSlot(index: number) {
    if (!selected) return
    const current = slots[index]
    let positionNumber = current?.positionNumber
    if (positionNumber === undefined) {
      const used = new Set(slots.map((slot) => slot?.positionNumber))
      positionNumber = 1
      while (used.has(positionNumber)) positionNumber++
    }
    const placed: PlacedProduct = { ...selected, positionNumber }
    setSlots(slots.map((slot, i) => (i === index ? placed : slot)))
  }

  function clearSlot(index: number) {
    setSlots(slots.map((slot, i) => (i === index ? null : slot)))
  }

  function resizeBar(newSize: number) {
    const size = Math.min(Math.max(newSize, MIN_SLOTS), MAX_SLOTS)
    const resized = []
    for (let i = 0; i < size; i++) {
      resized.push(slots[i] ?? null)
    }
    setSlots(resized)
  }

  function addColumn() {
    resizeBar(slots.length + 2)
  }

  function removeColumn() {
    resizeBar(slots.length - 2)
  }

  const query = search.trim().toLowerCase()
  const filteredEntries = serverEntries.filter(
    (entry) =>
      entry.productName.toLowerCase().includes(query) &&
      (category === null || entry.category === category),
  )
  const noMatches = serverEntries.length > 0 && filteredEntries.length === 0

  // Odd sizes need one extra column (15 -> 8)
  const columns = Math.ceil(slots.length / 2)
  const topRow = columns
  const bottomRow = slots.length - columns

  return (
    <>
      <header className="site-header">
        <h1>Salad bar planner</h1>
        <nav>
          <a href="#" className="active">Builder</a>
          <a href="#">Saved examples</a>
        </nav>
      </header>

      <main
        className={[
          'layout',
          !showProducts && 'products-hidden',
          !showCosts && 'costs-hidden',
        ]
          .filter(Boolean)
          .join(' ')}
      >
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

              {!loaded && (
                <button type="button" onClick={loadServerEntries}>
                  Load from backend
                </button>
              )}
              {loadError && <p>{loadError}</p>}

              <input
                type="search"
                className="product-search"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="category-list">
                {CATEGORIES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={category === name ? 'category-chip active' : 'category-chip'}
                    aria-pressed={category === name}
                    onClick={() => setCategory(category === name ? null : name)}
                  >
                    {name}
                  </button>
                ))}
              </div>

              {noMatches && (
                <div className="no-results" role="status">
                  <p>
                    {query
                      ? `No products match “${search.trim()}”`
                      : 'No products'}
                    {category && ` in ${category}`}.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      setCategory(null)
                    }}
                  >
                    {query && category ? 'Clear filters' : query ? 'Clear search' : 'Show all products'}
                  </button>
                </div>
              )}

              <ul className="product-grid">
                {filteredEntries.map((entry) => (
                  <li
                    key={entry.listKey}
                    className={
                      selected?.listKey === entry.listKey
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
                    <ProductName name={entry.productName} />
                  </li>
                ))}
              </ul>
            </>
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

              <label className="custom-size">
                Custom:
                <select
                  value={slots.length}
                  onChange={(e) => resizeBar(Number(e.target.value))}
                >
                  {SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="size-button"
                onClick={removeColumn}
                disabled={slots.length <= MIN_SLOTS}
                title="Remove one column (2 slots)"
              >
                −
              </button>
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
            {slots.length} slots ({topRow} + {bottomRow}) ·{' '}
            {selected
              ? `Holding: ${selected.productName} – click a slot to place it`
              : 'Click a product on the left, then click a slot'}
          </p>

          <div
            className={slots.length >= WRAP_NAMES_FROM ? 'slot-grid wrap-names' : 'slot-grid'}
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {slots.map((product, index) => (
              <div
                key={index}
                className={product ? 'slot filled' : 'slot'}
                onClick={() => placeInSlot(index)}
              >
                {product ? (
                  <>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.productName} />
                    ) : (
                      <div className="no-image">{product.productName.charAt(0)}</div>
                    )}
                    <ProductName name={product.productName} />
                    <button
                      type="button"
                      className="slot-clear"
                      onClick={(e) => {
                        e.stopPropagation() // don't also place into the slot
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
        </aside>
      </main>
    </>
  )
}

export default App
