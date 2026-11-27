import { useId } from 'react'
import type { Cart } from '../types/Cart'
import './selection-components.css'

type CartSelectionProps = {
  carts: Cart[]
  selectedCartId: string | null
  onSelect: (cartId: string) => void
}

function CartSelection({ carts, selectedCartId, onSelect }: CartSelectionProps) {
  const radioGroupId = useId()

  return (
    <fieldset className="cart-selection">
      <legend>Choose a cart</legend>
      {carts.map((cart) => (
        <label
          key={cart.id}
          className={`cart-option${selectedCartId === cart.id ? ' selected' : ''}`}
        >
          <input
            type="radio"
            name={radioGroupId}
            value={cart.id}
            checked={selectedCartId === cart.id}
            onChange={() => onSelect(cart.id)}
          />
          <span className="cart-option-details">
            <span className="cart-name">{cart.name}</span>
            <span className="cart-capacity">Capacity: {cart.capacity}</span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}

export default CartSelection