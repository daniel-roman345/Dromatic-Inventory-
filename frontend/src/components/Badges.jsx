/** Estado de stock de un producto. */
export function StockBadge({ product }) {
  if (product.status === 'INACTIVO') return <span className="badge badge-gray">Inactivo</span>
  if (product.quantity === 0) return <span className="badge badge-red">Agotado</span>
  if (product.lowStock) return <span className="badge badge-amber">Stock bajo</span>
  return <span className="badge badge-green">Disponible</span>
}

export function MovementTypeBadge({ type }) {
  return type === 'ENTRADA'
    ? <span className="badge badge-green">📥 Entrada</span>
    : <span className="badge badge-red">📤 Salida</span>
}
