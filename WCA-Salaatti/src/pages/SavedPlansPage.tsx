import { useEffect, useState } from 'react'
import type { categories as Cart } from '../types/Cart'
import { deletePlan, fetchCarts, fetchPlans, type PlanSummary } from '../api/plansApi'

type Props = {
  onOpen: (id: number) => void
  onDeleted: (id: number) => void
  openError: string
}

type Status = 'loading' | 'error' | 'ready'

export default function SavedPlansPage({ onOpen, onDeleted, openError }: Props) {
  const [plans, setPlans] = useState<PlanSummary[]>([])
  const [carts, setCarts] = useState<Cart[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  async function loadPlans() {
    setStatus('loading')
    try {
      const [planRows, cartRows] = await Promise.all([fetchPlans(), fetchCarts()])
      setPlans(planRows)
      setCarts(cartRows)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }

  useEffect(() => {
    let ignore = false
    Promise.all([fetchPlans(), fetchCarts()])
      .then(([planRows, cartRows]) => {
        if (ignore) return
        setPlans(planRows)
        setCarts(cartRows)
        setStatus('ready')
      })
      .catch(() => {
        if (!ignore) setStatus('error')
      })
    return () => {
      ignore = true
    }
  }, [])

  function cartLabel(cartId: string) {
    const cart = carts.find((c) => c.id === cartId)
    return cart ? `${cart.name} (${cart.capacity} positions)` : `unknown cart (${cartId})`
  }

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setMessage('')
    setBusyId(id)
    try {
      await deletePlan(id)
      onDeleted(id)
      await loadPlans()
    } catch {
      setMessage('Could not delete the plan. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="saved-page">
      <div className="column-header">
        <h2>Saved examples</h2>
        <button type="button" onClick={loadPlans} disabled={status === 'loading'}>
          Refresh
        </button>
      </div>

      {openError && <p className="plan-error">{openError}</p>}
      {message && <p className="plan-error">{message}</p>}

      {status === 'loading' && (
        <p className="loading-state">
          <span className="spinner" /> Loading saved plans…
        </p>
      )}

      {status === 'error' && (
        <div className="plan-error">
          <p>Could not load saved plans. Check that the backend is running.</p>
          <button type="button" onClick={loadPlans}>
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && plans.length === 0 && (
        <p className="no-results">No saved plans yet. Build a salad bar and click Save.</p>
      )}

      {status === 'ready' && plans.length > 0 && (
        <ul className="plan-list">
          {plans.map((plan) => (
            <li key={plan.id} className="plan-card">
              <div className="plan-info">
                <strong>{plan.name}</strong>
                <span>Cart: {cartLabel(plan.cartId)}</span>
              </div>
              <div className="plan-actions">
                <button type="button" onClick={() => onOpen(plan.id)} disabled={busyId !== null}>
                  Open
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => handleDelete(plan.id, plan.name)}
                  disabled={busyId !== null}
                >
                  {busyId === plan.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}