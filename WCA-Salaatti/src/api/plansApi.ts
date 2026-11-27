import type { Cart } from '../types/Cart'
import type { plan } from '../types/plan'

const API_URL = 'http://localhost:3001/api'

// GET /api/plans returns id, name and cartId for each plan
export type PlanSummary = { id: number; name: string; cartId: string }

// GET /api/plans/:id returns positions filled out to the cart's capacity
export type SavedPlan = plan & { id: number }

export async function fetchCarts(): Promise<Cart[]> {
  const response = await fetch(`${API_URL}/carts`)
  if (!response.ok) throw new Error('Could not load the carts')
  const rows: Cart[] = await response.json()
  return rows.map((cart) => ({ ...cart, id: String(cart.id), capacity: Number(cart.capacity) }))
}

export async function fetchPlans(): Promise<PlanSummary[]> {
  const response = await fetch(`${API_URL}/plans`)
  if (!response.ok) throw new Error('Could not load saved plans')
  const rows: PlanSummary[] = await response.json()
  return rows.map((row) => ({ ...row, cartId: String(row.cartId) }))
}

export async function fetchPlan(id: number): Promise<SavedPlan> {
  const response = await fetch(`${API_URL}/plans/${id}`)
  if (response.status === 404) throw new Error('This plan no longer exists')
  if (!response.ok) throw new Error('Could not open the plan')
  const saved: SavedPlan = await response.json()
  return { ...saved, cartId: String(saved.cartId) }
}

// No id = new plan (POST), otherwise update it (PUT). Returns the plan's id.
export async function savePlan(newPlan: plan, id: number | null): Promise<number> {
  const response = await fetch(id === null ? `${API_URL}/plans` : `${API_URL}/plans/${id}`, {
    method: id === null ? 'POST' : 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newPlan),
  })

  if (response.status === 400) {
    const body: { details?: unknown[] } = await response.json().catch(() => ({}))
    const details = Array.isArray(body.details)
      ? ' ' + body.details.map((d) => (typeof d === 'string' ? d : JSON.stringify(d))).join(' ')
      : ''
    throw new Error(`Could not save the plan.${details}`)
  }
  if (response.status === 404) throw new Error('This plan no longer exists. Click New to save it as a new plan.')
  if (!response.ok) throw new Error('The server could not save the plan. Please try again.')

  const saved: { id: number } = await response.json()
  return saved.id
}

export async function deletePlan(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/plans/${id}`, { method: 'DELETE' })
  if (!response.ok && response.status !== 404) throw new Error('Could not delete the plan')
}