# ElRata.io — Busca como rata, compra como rey

Comparador de precios con inteligencia artificial que busca en tiendas reales de +16 países de Latinoamérica y el mundo.

> Este proyecto nació con fines educativos y de aprendizaje, creado para la hackaton de [midudev](https://midu.dev). El código fuente es de solo lectura — todos los derechos reservados. El proyecto podría evolucionar a un producto comercial en el futuro. Ver [NOTICE](./NOTICE).

## Qué es ElRata.io

ElRata.io nace de una idea simple: nadie debería pagar de más por un producto que está más barato en otra tienda. La herramienta busca precios en MercadoLibre, Google Shopping y tiendas online de tu país, y luego usa IA para analizar los resultados y recomendarte la mejor opción.

El nombre "rata" se usa con orgullo — ser rata es ser inteligente con tu plata.

## Qué hace

- Busca productos en tiendas reales de tu ciudad y país
- Compara precios en una tabla con nombre, precio, tienda y link directo
- Analiza resultados con múltiples modelos de IA (round-robin entre proveedores)
- Permite guardar búsquedas organizadas en carpetas
- Crea alertas de precio que monitorean cada hora y te notifican por email
- Muestra historial de precios para ver tendencias
- Soporta búsqueda en URLs personalizadas de tiendas

## Stack y tecnologías

| Categoría | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 |
| UI | React 19, Tailwind CSS 4 |
| Animaciones | Motion (Framer Motion) 12 |
| Base de datos | Supabase (PostgreSQL + Auth) |
| IA | Round-robin entre Groq, Cerebras y OpenRouter |
| Búsqueda web | Cadena de fallback: Serper, SerpAPI, Google Custom Search |
| Scraping | Cheerio (HTML parsing) + MercadoLibre API oficial |
| Email | Resend |
| Validación | Zod 4 |
| Componentes UI | Radix UI (Dialog, Select, Label) |
| Fuentes | Open Sans, Inter, Maghfirea (custom) |

## Arquitectura

```
app/                  Rutas y páginas (Next.js App Router)
  (public)/           Landing page pública
  (auth)/             Rutas protegidas (dashboard, alertas)
  login/              Autenticación
  api/                API routes (búsqueda, alertas, cron)

components/
  landing/            Componentes de la landing (Hero, Features, Pricing...)
  ui/                 Componentes reutilizables (Button, Input, Modal...)
  dashboard/          Componentes del dashboard
  results/            Componentes de resultados de búsqueda
  alerts/             Componentes de alertas de precio

lib/
  ai/                 Proveedores de IA y analizador (round-robin)
  search/             Motor de búsqueda web (cadena de fallback)
  crawlers/
    apis/             MercadoLibre API oficial (OAuth2, token app-level)
    generic.ts        Scraper genérico (Cheerio) para cualquier URL
    index.ts          Router: API ML + tiendas por país + URLs del usuario
  supabase/           Cliente y servidor de Supabase
  email/              Envío de emails con Resend
  validators/         Schemas de validación con Zod

Tablas Supabase: folders, searches, price_alerts, price_history, user_stores, stores_catalog, store_categories, app_settings (tokens ML)
```

## Deploy

El proyecto se deployea en un VPS con [Dokploy](https://dokploy.com) usando **Nixpacks** como build system. Nixpacks detecta automáticamente Next.js y no requiere Dockerfile.

El cron job de alertas se configura en Dokploy con el schedule `0 * * * *` llamando a `/api/cron/check-prices` con el header `x-cron-secret`.

## Cómo funciona (resumen técnico)

1. El usuario ingresa un producto, ciudad y país
2. El sistema busca en paralelo:
   - **MercadoLibre API** (si hay token OAuth2) — datos JSON directos
   - **Scraper genérico (Cheerio)** — Falabella, Sodimac, PCFactory, Paris y más según el país
   - **Web Search** (Serper > SerpAPI > Google CSE) — resultados de Google
3. Paginación dinámica: si la primera página tiene suficientes resultados, busca páginas 2 y 3
4. Se deduplican y ordenan por precio
5. Un modelo de IA analiza los resultados y genera una recomendación
6. Se muestra una tabla comparativa con precios, tiendas y links directos
7. El usuario puede guardar la búsqueda, crear alertas y organizar en carpetas
8. Un cron job monitorea las alertas cada hora y envía emails cuando el precio baja

### Tiendas por país

| País | Tiendas |
|------|---------|
| Chile | MercadoLibre, Falabella, Sodimac, PCFactory, Paris |
| Colombia | MercadoLibre, Falabella, Éxito |
| Perú | MercadoLibre, Falabella |
| México | MercadoLibre, Liverpool, Coppel |
| Argentina | MercadoLibre, Frávega, Garbarino |

Los usuarios pueden agregar URLs de tiendas adicionales desde su perfil.

## Licencia

 **Todos los derechos reservados.** Este código se publica de forma abierta para fines de visualización y educativos. No se otorga permiso distribuir o comercializar este software.