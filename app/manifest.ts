import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ElRata.io',
    short_name: 'ElRata',
    description: 'Compara precios con IA en +16 países. Alertas de precio y búsquedas inteligentes.',
    start_url: '/',
    display: 'standalone',
    background_color: '#151518',
    theme_color: '#151518',
    icons: [
      {
        src: '/icons/rata.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
