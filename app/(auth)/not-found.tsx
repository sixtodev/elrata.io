import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#151518' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🐀</div>
        <h2 style={{ color: '#fefeff', fontSize: '24px', fontFamily: 'var(--font-title)', marginBottom: '8px' }}>404 — Página no encontrada</h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>Esta rata se perdió</p>
        <Link href="/dashboard" style={{ background: '#c4ef16', color: '#000', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
          Volver al dashboard
        </Link>
      </div>
    </div>
  )
}
