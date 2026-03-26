'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#151518', color: '#fefeff' }}>
      <span style={{ fontSize: '48px' }}>🐀</span>
      <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '24px' }}>Algo salió mal</h2>
      <p style={{ color: '#6b7280', fontSize: '14px' }}>{error.message}</p>
      <button
        onClick={reset}
        style={{ padding: '10px 24px', background: '#c4ef16', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
      >
        Reintentar
      </button>
    </div>
  )
}
