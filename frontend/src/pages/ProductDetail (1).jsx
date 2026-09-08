import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout.jsx'
import { getProduct } from '../services/productService'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getProduct(id).then(setProduct).catch(() => setError('No se encontraron productos.'))
  }, [id])

  if (error) return <PrivateLayout><p className="error-text">{error}</p></PrivateLayout>
  if (!product) return <PrivateLayout><p>Cargando...</p></PrivateLayout>

  return (
    <PrivateLayout>
      <h2 style={{ marginBottom: 16 }}>{product.name}</h2>
      <div className="card" style={{ maxWidth: 480 }}>
        <p><strong>Código:</strong> {product.code}</p>
        <p><strong>Descripción:</strong> {product.description || '—'}</p>
        <p><strong>Cantidad:</strong> {product.quantity}</p>
        <p><strong>Stock mínimo:</strong> {product.minimumStock}</p>
        <p><strong>Ubicación:</strong> {product.locationLabel}</p>
        <p><strong>Fecha de ingreso:</strong> {product.entryDate}</p>
        <p><strong>Estado:</strong> <span className={product.lowStock ? 'badge-low' : 'badge-ok'}>{product.lowStock ? 'Stock bajo' : 'Stock disponible'}</span></p>
      </div>
    </PrivateLayout>
  )
}
