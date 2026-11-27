import { useState, type CSSProperties } from 'react'
import './App.css'
import type { ProductData } from './types/ProductData'
import Product from './components/Product'
import SavedPlansPage from './pages/SavedPlansPage'
import { fetchCarts, fetchPlan, savePlan } from './api/plansApi'
import type { categories as Cart } from './types/Cart'

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
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ProductData | null>(null)
  const [slots, setSlots] = useState<(ProductData | null)[]>(Array(DEFAULT_SIZE).fill(null))
  const [sizeInput, setSizeInput] = useState(String(DEFAULT_SIZE))
  const [showProducts, setShowProducts] = useState(true)
  const [showCosts, setShowCosts] = useState(true)

  const [page, setPage] = useState<'builder' | 'saved'>('builder')
  const [planId, setPlanId] = useState<number | null>(null)
  const [planName, setPlanName] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [planMessage, setPlanMessage] = useState('')
  const [openError, setOpenError] = useState('')
  const [carts, setCarts] = useState<Cart[] | null>(null)

  async function loadServerEntries(): Promise<ProductData[] | null> {
    setLoadError('')
    try {
      const response = await fetch('http://localhost:3001/api/products')
      if (!response.ok) throw new Error('Could not load entries')
      const products: ProductData[] = await response.json()
      setServerEntries(products)
      setLoaded(true)
      return products
    } catch {
      setLoadError('Could not connect to the backend.')
      return null
    }
  }

  function markChanged() {
    setHasUnsavedChanges(true)
    setPlanMessage('')
  }

  const searchTerm = search.trim().toLowerCase()
  const visibleProducts = serverEntries.filter(
    (entry) =>
      entry.productName.toLowerCase().includes(searchTerm) ||
      String(entry.productCode).toLowerCase().includes(searchTerm),
  )

  function selectProduct(product: ProductData) {
    setSelected(selected === product ? null : product)
  }

  function placeInSlot(index: number) {
    if (!selected) return
    setSlots(slots.map((slot, i) => (i === index ? selected : slot)))
    setSelected(null)
    markChanged()
  }

  // Empties one position; numbering and the other positions stay as they are
  function clearSlot(index: number) {
    setSlots(slots.map((slot, i) => (i === index ? null : slot)))
    markChanged()
  }

  // Products keep their spot; shrinking removes slots from the end
  function resizeBar(newSize: number) {
    const size = Math.min(MAX_SLOTS, Math.max(MIN_SLOTS, Math.round(newSize)))
    const resized = []
    for (let i = 0; i < size; i++) {
      resized.push(slots[i] ?? null)
    }
    setSizeInput(String(size))
    if (size === slots.length) return
    setSlots(resized)
    markChanged()
  }

  function applySizeInput() {
    const value = Number(sizeInput)
    if (sizeInput.trim() === '' || Number.isNaN(value)) {
      setSizeInput(String(slots.length))
      return
    }
    resizeBar(value)
  }

  async function handleSave() {
    if (!planName.trim()) {
      setPlanMessage('Give the plan a name before saving.')
      return
    }
    setSaving(true)
    setPlanMessage('')
    try {
      const cartList = carts ?? (await fetchCarts())
      setCarts(cartList)

      // A plan must point to a cart in the database, so the size has to match one
      const cart = cartList.find((c) => c.capacity === slots.length)
      if (!cart) {
        const sizes = cartList.map((c) => c.capacity).join(', ')
        setPlanMessage(`No cart has ${slots.length} positions. Available sizes: ${sizes}.`)
        return
      }

      const id = await savePlan(
        {
          name: planName.trim(),
          cartId: cart.id,
          positions: slots.map((product, i) => ({
            positionNumber: i + 1,
            productId: product ? product.id : null,
          })),
        },
        planId,
      )
      setPlanId(id)
      setHasUnsavedChanges(false)
      setPlanMessage('Saved.')
    } catch (error) {
      setPlanMessage(error instanceof Error ? error.message : 'Could not save the plan.')
    } finally {
      setSaving(false)
    }
  }

  function confirmDiscard() {
    return !hasUnsavedChanges || window.confirm('Discard your unsaved changes?')
  }

  function handleNewPlan() {
    if (!confirmDiscard()) return
    setPlanId(null)
    setPlanName('')
    setSlots(Array(DEFAULT_SIZE).fill(null))
    setSizeInput(String(DEFAULT_SIZE))
    setSelected(null)
    setHasUnsavedChanges(false)
    setPlanMessage('')
  }

  async function handleOpenPlan(id: number) {
    if (!confirmDiscard()) return
    setOpenError('')
    try {
      const plan = await fetchPlan(id)
      const products = loaded ? serverEntries : await loadServerEntries()
      if (!products) throw new Error('Could not load the products for this plan')

      const byId = new Map(products.map((p) => [p.id, p]))
      const size = plan.positions.length
      const opened = Array.from({ length: size }, (_, i) => {
        const productId = plan.positions.find((p) => p.positionNumber === i + 1)?.productId
        return productId == null ? null : (byId.get(productId) ?? null)
      })

      setPlanId(plan.id)
      setPlanName(plan.name)
      setSlots(opened)
      setSizeInput(String(size))
      setSelected(null)
      setHasUnsavedChanges(false)
      setPlanMessage('')
      setPage('builder')
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : 'Could not open the plan.')
    }
  }

  // If the open plan was deleted, keep the builder content as a new, unsaved plan
  function handlePlanDeleted(id: number) {
    if (id !== planId) return
    setPlanId(null)
    setHasUnsavedChanges(true)
    setPlanMessage('')
  }

  function goTo(target: 'builder' | 'saved') {
    setOpenError('')
    setPage(target)
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
          <a
            href="#"
            className={page === 'builder' ? 'active' : undefined}
            onClick={(e) => {
              e.preventDefault()
              goTo('builder')
            }}
          >
            Builder
          </a>
          <a
            href="#"
            className={page === 'saved' ? 'active' : undefined}
            onClick={(e) => {
              e.preventDefault()
              goTo('saved')
            }}
          >
            Saved examples
          </a>
        </nav>
      </header>

      {page === 'saved' ? (
        <SavedPlansPage
          onOpen={handleOpenPlan}
          onDeleted={handlePlanDeleted}
          openError={openError}
        />
      ) : (
        <main
          className="layout"
          style={{ '--layout-columns': layoutColumns } as CSSProperties}
        >
          <aside className={showProducts ? 'column products' : 'column products collapsed'}>
            <div className="column-header">
              <h2>Products</h2>
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
                    <button type="button" onClick={() => loadServerEntries()}>
                      Load from backend
                    </button>
                    {loadError && <p>{loadError}</p>}
                  </>
                ) : (
                  <input
                    type="search"
                    className="product-search"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                )}

                {loaded && visibleProducts.length === 0 && (
                  <p className="no-results">No products match "{search}".</p>
                )}

                <ul className="product-grid">
                  {visibleProducts.map((entry) => (
                    <li
                      // productCode alone isn't unique in the data, so name is added
                      key={`${entry.productCode}-${entry.productName}`}
                      className={selected === entry ? 'product-card selected' : 'product-card'}
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

            <div className="plan-bar">
              <input
                className="plan-name"
                placeholder="Plan name"
                value={planName}
                maxLength={100}
                onChange={(e) => {
                  setPlanName(e.target.value)
                  markChanged()
                }}
              />
              <button type="button" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={handleNewPlan}>
                New
              </button>
              <span className={hasUnsavedChanges ? 'plan-status unsaved' : 'plan-status'}>
                {planMessage || (hasUnsavedChanges ? 'Unsaved changes' : planId ? 'Saved' : '')}
              </span>
            </div>

            <p className="salad-bar-hint">
              {selected
                ? `Holding: ${selected.productName} – click a slot to place it`
                : 'Click a product on the left, then click a slot'}
            </p>

            <div
              className="slot-grid"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(64px, 1fr))` }}
            >
              {slots.map((product, index) => (
                <div
                  key={index}
                  className={product ? 'slot filled' : 'slot'}
                  onClick={() => placeInSlot(index)}
                  title={product?.productName}
                >
                  <span className="slot-number">{index + 1}</span>

                  {product ? (
                    <>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.productName} />
                      ) : (
                        <div className="no-image">{product.productName.charAt(0)}</div>
                      )}
                      <span className="slot-name">{product.productName}</span>
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

          <aside className={showCosts ? 'column costs' : 'column costs collapsed'}>
            <div className="column-header">
              <button
                type="button"
                className="toggle-products"
                onClick={() => setShowCosts(!showCosts)}
                title={showCosts ? 'Hide cost accounting' : 'Show cost accounting'}
              >
                {showCosts ? '›' : '‹'}
              </button>
              <h2>Cost accounting</h2>
            </div>

            {showCosts && <>{/* cost accounting content goes here */}</>}
          </aside>
        </main>
      )}
    </>
  )
}

export default App