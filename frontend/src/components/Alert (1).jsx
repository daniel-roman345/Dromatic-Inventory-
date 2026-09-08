export default function Alert({ type = 'error', message }) {
  if (!message) return null
  return (
    <p className={type === 'error' ? 'error-text' : 'success-text'} style={{ marginBottom: 12 }}>
      {message}
    </p>
  )
}
