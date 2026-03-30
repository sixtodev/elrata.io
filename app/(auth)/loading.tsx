import Image from 'next/image'

export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#151518' }}>
      <div style={{ textAlign: 'center' }}>
        <Image
          src="/icons/rata.webp"
          alt="Cargando..."
          width={80}
          height={80}
          className="mx-auto animate-bounce drop-shadow-[0_0_24px_rgba(196,239,22,0.5)]"
          priority
        />
        <p style={{ color: '#6b7280', marginTop: '16px', fontSize: '14px' }}>Cargando...</p>
      </div>
    </div>
  )
}
