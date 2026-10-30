import { useState } from 'react'
import './App.css'
import type { ProductData } from './types/ProductData'
import Product from './components/Product'

function App() {
  const [entries] = useState<ProductData[]>([])
  const [serverEntries, setServerEntries] = useState<ProductData[]>([])
  const [loadError, setLoadError] = useState('')

  async function loadServerEntries() {
    setLoadError('')
    try {
      const response = await fetch('http://localhost:3001/api/entries')
      if (!response.ok) throw new Error('Could not load entries')
      const data: ProductData[] = await response.json()
      setServerEntries(data)
    } catch {
      setLoadError('Could not connect to the backend.')
    }
  }

  return (
    <main>
      {entries.map((entry) => (
        <Product key={entry.productCode} entry={entry} />
      ))}

      <section>
        <h2>Entries from the backend</h2>
        <button type="button" onClick={loadServerEntries}>
          Load from backend
        </button>
        {loadError && <p>{loadError}</p>}
        <ul>
          {serverEntries.map((entry) => (
            <li key={entry.productCode}>{entry.productName}</li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default App