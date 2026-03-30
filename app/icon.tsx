import { ImageResponse } from 'next/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: '#151518',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '16px',
      }}
    >
      <span
        style={{
          fontSize: 36,
          fontWeight: 900,
          color: '#c4ef16',
          fontFamily: 'Georgia, serif',
          letterSpacing: '-1px',
          lineHeight: 1,
        }}
      >
        R
      </span>
    </div>,
    { ...size }
  )
}
