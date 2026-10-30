import { useState, type FormEvent } from 'react'
import './App.css'
import type { ProductData } from './types/ProductData'
import Product from './components/Product'

function App() {
  const [entries, setEntries] = useState<ProductData[]>([])

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [gnsize, setGnsize] = useState('')
  const [price, setPrice] = useState(0)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return

    const newEntry: ProductData = {
      id: Date.now(),
      name: name.trim(),
      category: category.trim(),
      gnsize: gnsize.trim(),
      price,
    }

    setEntries((current) => [...current, newEntry])

    setName('')
    setCategory('')
    setGnsize('')
    setPrice(0)
  }

  return (
    <main>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <label htmlFor="category">Category</label>
          <input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>

        <div>
          <label htmlFor="gnsize">Size</label>
          <input id="gnsize" value={gnsize} onChange={(e) => setGnsize(e.target.value)} />
        </div>

        <div>
          <label htmlFor="price">Price (€)</label>
          <input
            id="price"
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </div>

        <button type="submit">Add entry</button>
      </form>

      {entries.map((entry) => (
        <Product key={entry.id} entry={entry} />
      ))}
    </main>
  )
}

export default App