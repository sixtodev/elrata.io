import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/alerts', '/api/'],
      },
    ],
    sitemap: 'https://elrata.io/sitemap.xml',
  }
}
