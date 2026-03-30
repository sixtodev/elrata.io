# ElRata.io — Busca como rata, compra como rey

> Inspirado en las ofertas ratas que [midudev](https://midu.dev) muestra en sus directos 😂

Comparador de precios con inteligencia artificial que busca en tiendas reales de +16 países de Latinoamérica y el mundo. Proyecto creado para la hackathon de [midudev](https://midu.dev).

## Qué es ElRata.io

ElRata.io nace de una idea simple: nadie debería pagar de más por un producto que está más barato en otra tienda. La herramienta busca precios en MercadoLibre, Amazon, Google Shopping y tiendas online de tu país, y luego usa IA para analizar los resultados y recomendarte la mejor opción.

El nombre "rata" se usa con orgullo — ser rata es ser inteligente con tu plata.

## Qué hace

- Busca productos en MercadoLibre, Amazon y Google Shopping en paralelo
- Compara precios con nombre, precio, tienda y link directo
- Analiza resultados con múltiples modelos de IA (Groq, Cerebras, OpenRouter)
- Permite guardar búsquedas completas o productos individuales en carpetas
- Crea alertas de precio que monitorean cada hora y notifican por email
- Muestra historial de precios para ver tendencias
- Soporta búsqueda en URLs personalizadas de tiendas
- Versión Pro con búsquedas ilimitadas y funcionalidades avanzadas

## Stack y tecnologías

| Categoría | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, Lucide React |
| Animaciones | Motion (Framer Motion) 12, Three.js |
| Base de datos | Supabase (PostgreSQL + Auth) |
| IA | Round-robin entre Groq, Cerebras y OpenRouter |
| Búsqueda web | Cadena de fallback: Serper → SerpAPI → Google Custom Search |
| MercadoLibre | Serper `site:mercadolibre.xx` (Google indexa todos los listings) |
| Amazon | ScraperAPI structured endpoint |
| URLs custom | ScraperAPI HTML scraping con IPs residenciales |
| Email | Resend |
| Validación | Zod 4 |
| Fuentes | Boska (títulos), Open Sans (cuerpo) |
| Deploy | VPS con Dokploy + Nixpacks |

## Arquitectura

```
app/                  Rutas y páginas (Next.js App Router)
  (public)/           Landing page pública
  (auth)/             Rutas protegidas (dashboard, alertas)
  login/              Autenticación
  api/                API routes (búsqueda, alertas, cron)

components/
  landing/            Landing (Hero, Features, Pricing, SearchDrawer...)
  ui/                 Componentes reutilizables (Button, Input, Modal...)
  dashboard/          Dashboard Pro
  results/            Resultados de búsqueda
  alerts/             Alertas de precio

lib/
  ai/                 Proveedores de IA y analizador (round-robin)
  search/             Orquestador + motor de búsqueda web
  crawlers/
    mercadolibre-playwright.ts  ML via Serper shopping+organic
    amazon.ts                   Amazon via ScraperAPI structured
    generic.ts                  Scraper genérico para URLs custom
  supabase/           Cliente y servidor de Supabase
  email/              Envío de emails con Resend
  validators/         Schemas de validación con Zod

Tablas Supabase: folders, searches, price_alerts, price_history, user_stores, app_settings
```

## Cómo funciona (resumen técnico)

1. El usuario ingresa un producto, ciudad y país
2. El sistema busca en paralelo según la fuente elegida:
   - **MercadoLibre** — via Serper `/shopping` + `/search` con `site:mercadolibre.xx` (evita bloqueos de IPs de datacenter)
   - **Amazon** — via ScraperAPI structured endpoint, TLD dinámico por país (amazon.ca, amazon.com.mx, etc.)
   - **Google Shopping** — Serper → SerpAPI → Google CSE (cadena de fallback)
   - **URL custom** — ScraperAPI HTML scraping con IPs residenciales
3. Los resultados se deduplicан y ordenan por precio
4. Un modelo de IA analiza los resultados y genera recomendaciones
5. Se muestra tabla comparativa con precios formateados por moneda local
6. El usuario puede guardar la búsqueda completa o productos individuales en carpetas
7. Un cron job monitorea las alertas cada hora y envía emails cuando el precio baja
