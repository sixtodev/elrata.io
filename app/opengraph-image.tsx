import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'ElRata.io — Busca como rata, compra como rey'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#151518',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: '120px', marginBottom: '24px' }}>🐀</div>
        <div
          style={{
            fontSize: '48px',
            fontWeight: 700,
            color: '#fefeff',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ color: '#c4ef16' }}>ElRata</span>
          <span style={{ color: '#6b7280' }}>.io</span>
        </div>
        <div
          style={{
            fontSize: '28px',
            color: '#6b7280',
          }}
        >
          Busca como rata, compra como rey
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '0',
            right: '0',
            height: '4px',
            background: '#c4ef16',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
