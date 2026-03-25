export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#151518' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', animation: 'bounce-rat 2.5s ease-in-out infinite' }}>🐀</div>
        <p style={{ color: '#6b7280', marginTop: '16px', fontSize: '14px' }}>Cargando...</p>
      </div>
    </div>
  )
}
