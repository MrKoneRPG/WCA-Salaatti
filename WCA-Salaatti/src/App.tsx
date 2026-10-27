import { useState } from 'react'
import './App.css'

type ProductData = {
  id: number
  name: string
  category: string
  gnsize: string
  price: number
}

const initialEntries: ProductData[] = []

function App() {
  const [entries, setEntries] = useState<ProductData[]>(initialEntries)

  // Statet
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [gnsize, setGnsize] = useState("")
  const [price, setPrice] = useState(0)

  function handleAddEntry() {
    // Product luonti
    const newEntry: ProductData = {
      id: Date.now(),
      name: name,
      category: category,
      gnsize: gnsize,
      price: price,
    }

    setEntries((currentEntries) => [...currentEntries, newEntry])

    // Formin resetointi
    setName("")
    setCategory("")
    setGnsize("")
    setPrice(0)
  }

  return (
    <main>
      <form>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <br />

        <label htmlFor="category">Category</label>
        <input
          id="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
        <br />

        <label htmlFor="gnsize">Size</label>
        <textarea
          id="gnsize"
          value={gnsize}
          onChange={(event) => setGnsize(event.target.value)}
        />
        <br />

        <label htmlFor="price">Price</label>
        <input
          id="price"
          type="number"
          min={0}
          value={price}
          onChange={(event) => setPrice(Number(event.target.value))}
        />
        <br />

        <button type="button" onClick={handleAddEntry}>
          Add entry
        </button>
      </form>

      {entries.map((entry) => (
        <div key={entry.id}>
          <h3>{entry.name}</h3>
          <p>{entry.category} · {entry.gnsize} · {entry.price} €</p>
        </div>
      ))}
    </main>
  )
}

export default App