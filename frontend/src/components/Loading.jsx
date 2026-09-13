export default function Loading({ text = 'Cargando...' }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {text}
    </div>
  )
}
