import { forwardRef, useMemo, useState } from 'react'

/**
 * Buscador de productos por código o nombre.
 * Funciona con lector de código de barras: al escanear (el lector envía Enter)
 * se selecciona el producto cuyo código coincide exactamente.
 */
const ProductPicker = forwardRef(function ProductPicker(
  { products, onSelect, placeholder = 'Escriba o escanee el código, o escriba el nombre', autoFocus = false },
  ref
) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const query = text.trim().toLowerCase()

  const matches = useMemo(() => {
    if (!query) return []
    const score = (p) => {
      const code = p.code.toLowerCase()
      if (code === query) return 0
      if (code.startsWith(query)) return 1
      return 2
    }
    return products
      .filter((p) => p.code.toLowerCase().includes(query) || p.name.toLowerCase().includes(query))
      .sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name))
      .slice(0, 8)
  }, [query, products])

  function choose(product) {
    onSelect(product)
    setText('')
    setOpen(false)
    setActive(0)
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (!query) return
      const exact = products.find((p) => p.code.toLowerCase() === query)
      const pick = exact || matches[active]
      if (pick) choose(pick)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="picker">
      <input
        ref={ref}
        value={text}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder={placeholder}
        aria-label="Buscar producto por código o nombre"
        onChange={(e) => { setText(e.target.value); setOpen(true); setActive(0) }}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && matches.length > 0 && (
        <ul className="picker-list" role="listbox">
          {matches.map((p, i) => (
            <li
              key={p.id}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'active' : ''}
              onMouseDown={(e) => { e.preventDefault(); choose(p) }}
              onMouseEnter={() => setActive(i)}
            >
              <span><strong>{p.code}</strong> — {p.name}</span>
              <span className="muted">Stock: {p.quantity}</span>
            </li>
          ))}
        </ul>
      )}
      {open && query && matches.length === 0 && (
        <div className="picker-empty">No se encontró ningún producto con “{text.trim()}”.</div>
      )}
    </div>
  )
})

export default ProductPicker
