import type { Metadata, Viewport } from "next";
import { Open_Sans, Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { HideLoader } from "@/components/HideLoader";

const openSans = Open_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: '#151518',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://elrata.io'),
  title: "ElRata.io — Busca como rata, compra como rey",
  description:
    "Compara precios de cualquier producto en tu ciudad y país con IA. Guarda búsquedas, crea alertas de precio y recibe notificaciones cuando baje. Funciona en +16 países con múltiples modelos de IA.",
  keywords: [
    "comparar precios",
    "buscador de precios",
    "alertas de precio",
    "comparador IA",
    "precios baratos",
    "ofertas",
    "price comparison",
    "ElRata",
  ],
  alternates: {
    canonical: 'https://elrata.io',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "ElRata.io — Busca como rata, compra como rey 🐀",
    description:
      "Compara precios con IA en +16 países. Alertas de precio, carpetas de búsquedas y multi-modelo.",
    url: "https://elrata.io",
    siteName: "ElRata.io",
    locale: "es_LA",
    type: "website",
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ElRata.io — Busca como rata, compra como rey 🐀",
    description: "Compara precios con IA en +16 países.",
    creator: "@elrata_io",
    images: ['/opengraph-image'],
  },
  icons: {
    icon: [
      { url: '/icons/rata-icon.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/rata-icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/rata-icon.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/icons/rata-icon.png',
    apple: [
      { url: '/icons/rata-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${openSans.variable} ${inter.variable} ${geistMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  name: 'ElRata.io',
                  url: 'https://elrata.io',
                  logo: 'https://elrata.io/icons/rata.png',
                  description: 'Comparador de precios con IA en +16 países',
                },
                {
                  '@type': 'SoftwareApplication',
                  name: 'ElRata.io',
                  applicationCategory: 'ShoppingApplication',
                  operatingSystem: 'Web',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                  },
                  description: 'Comparador de precios con IA. Busca, compara y crea alertas de precio en +16 países.',
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <Script id="sw-unregister" strategy="beforeInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              registrations.forEach(function(r) { r.unregister(); });
            });
          }
        `}</Script>
        {/* CSS-only loader — server-rendered, only visible on slow networks (400ms delay) */}
        <div id="page-loader">
          <img src="/icons/rata.webp" alt="ElRata.io" width={96} height={96} />
          <div className="loader-text">
            El<span>Rata</span>.io
          </div>
          <div className="loader-bar-track">
            <div className="loader-bar-fill" />
          </div>
        </div>
        <HideLoader />
        {children}
      </body>
    </html>
  );
}
