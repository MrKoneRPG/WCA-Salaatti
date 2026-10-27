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
  const [productCode, setProductCode] = useState('')
  const [ean, setEan] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return

    const newEntry: ProductData = {
      id: Date.now(),
      name: name.trim(),
      category: category.trim(),
      gnsize: gnsize.trim(),
      productCode: productCode.trim(),
      ean: ean.trim(),
      imageUrl: imageUrl.trim(),
      price,
    }

    setEntries((current) => [...current, newEntry])

    setName('')
    setCategory('')
    setGnsize('')
    setPrice(0)
    setProductCode('')
    setEan('')
    setImageUrl('')
  }

  return (
      <main>
  <form onSubmit={handleSubmit}>
    <div>
      <label htmlFor="productCode">Product code</label>
      <input
        id="productCode"
        inputMode="numeric"
        value={productCode}
        onChange={(e) => setProductCode(e.target.value)}
      />
    </div>

    <div>
      <label htmlFor="ean">EAN</label>
      <input
        id="ean"
        inputMode="numeric"
        maxLength={13}
        value={ean}
        onChange={(e) => setEan(e.target.value)}
      />
    </div>

    <div>
      <label htmlFor="name">Name</label>
      <input
        id="name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </div>

    <div>
      <label htmlFor="category">Category</label>
      <input
        id="category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
    </div>

    <div>
      <label htmlFor="gnsize">GN size</label>
      <input
        id="gnsize"
        value={gnsize}
        onChange={(e) => setGnsize(e.target.value)}
      />
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

    <div>
      <label htmlFor="imageUrl">Image URL</label>
      <input
        id="imageUrl"
        type="url"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
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