import type { Metadata } from "next";
import { Open_Sans, Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
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
  },
  twitter: {
    card: "summary_large_image",
    title: "ElRata.io — Busca como rata, compra como rey 🐀",
    description: "Compara precios con IA en +16 países.",
    creator: "@elrata_io",
  },
  other: {
    "theme-color": "#151518",
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
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              registrations.forEach(function(r) { r.unregister(); });
            });
          }
        ` }} />
      </head>
      <body className="min-h-screen antialiased">
        {/* CSS-only loader — server-rendered, only visible on slow networks (400ms delay) */}
        <div id="page-loader">
          <img src="/icons/rata.webp" alt="" width={96} height={96} />
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
