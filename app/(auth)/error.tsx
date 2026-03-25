'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#151518' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐀</div>
        <h2 style={{ color: '#fefeff', fontSize: '20px', fontFamily: 'var(--font-title)', marginBottom: '8px' }}>Algo salió mal</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>{error.message}</p>
        <button onClick={reset} style={{ background: '#c4ef16', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
