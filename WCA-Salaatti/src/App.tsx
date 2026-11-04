import { useState } from 'react'
import './App.css'
import type { ProductData } from './types/ProductData'
import Product from './components/Product'

const MAX_SEGMENTS = 12;

type PanelProps = {
  title: string;
};

function Panel({ title }: PanelProps) {
  const [count, setCount] = useState(0);

  const addSegment = () => setCount((c) => Math.min(MAX_SEGMENTS, c + 1));
  const removeSegment = () => setCount((c) => Math.max(0, c - 1));

  return (
    <div className="panel">
      <span className="panel-title">{title}</span>

      <div className="controls">
        <button
          type="button"
          className="step"
          onClick={removeSegment}
          disabled={count === 0}
          aria-label="Remove segment"
          title="Remove segment"
        >
          -
        </button>
        <button
          type="button"
          className="step"
          onClick={addSegment}
          disabled={count === MAX_SEGMENTS}
          aria-label="Add segment"
          title="Add segment"
        >
          +
        </button>
      </div>

      <div className="segments">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="segment">
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

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
      <header className="topbar">
        <div className="topbar-left"></div>
        <div className="logo">Logo</div>
        <div className="topbar-right">
          <button>Sign in</button>
        </div>
      </header>

      <main className="workspace">
        <section className="editor">
          <div className="toolbar">
            <button>New</button>
            <button>Save</button>
            <button>Save new</button>
            <button>Load</button>
          </div>
          <div className="panels">
            <Panel title="Panel 1" />
            <Panel title="Panel 2" />
          </div>
        </section>

        <aside className="details">
          <h2>Details</h2>
        </aside>
      </main>

      <section className="catalog">
        <nav className="categories">
          <button>Meat</button>
          <button>Veggies</button>
          <button>Fruit</button>
        </nav>
        <h2>Products</h2>
        <div className="products">
          <div className="product">Product</div>
          <div className="product">Product</div>
          <div className="product">Product</div>
          <div className="product">Product</div>
        </div>
      </section>

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