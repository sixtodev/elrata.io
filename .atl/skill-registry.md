# Skill Registry — ElRata.io

**Project**: elrata
**Stack**: Next.js 16 + React 19 + TypeScript 5 + Tailwind 4 + Zod 4 + Three.js + Supabase + Motion 12

---

## User Skills

| Skill | Trigger |
|-------|---------|
| `nextjs-15` | When working with Next.js routing, API routes, Server Actions, layouts, middleware |
| `react-19` | When writing React components — no useMemo/useCallback needed |
| `typescript` | When writing TypeScript — types, interfaces, generics, strict mode |
| `tailwind-4` | When styling with Tailwind — cn(), theme variables, no var() in className |
| `zod-4` | When using Zod for validation — breaking changes from v3 |
| `threejs-fundamentals` | When working with Three.js scene setup, cameras, renderer, Object3D |
| `threejs-shaders` | When writing GLSL, ShaderMaterial, custom visual effects |
| `threejs-geometry` | When creating 3D shapes, BufferGeometry, instancing |
| `threejs-lighting` | When adding lights, shadows, environment lighting |
| `threejs-textures` | When working with textures, UV mapping, environment maps |
| `threejs-postprocessing` | When adding bloom, DOF, EffectComposer |
| `threejs-interaction` | When handling raycasting, controls, mouse/touch input |
| `motion` | When creating animations with Motion library |

---

## Compact Rules

### nextjs-15
- Server Components are default — no directive needed, async by default
- Client Components: add `"use client"` only when using useState, useEffect, event handlers, or browser APIs
- Server Actions: `"use server"` directive, use `revalidatePath` and `redirect`
- Route groups: `(auth)/` and `(public)/` don't affect URL — used for layout separation
- API routes: `app/api/*/route.ts` with named exports GET, POST, PUT, DELETE
- Parallel data fetching: `Promise.all([...])` in Server Components
- Middleware: `middleware.ts` at root for auth guards and redirects
- Use `import "server-only"` to prevent server code leaking to client
- Dynamic metadata: `export async function generateMetadata({ params })`

### react-19
- NEVER use `useMemo` or `useCallback` — React Compiler handles optimization automatically
- ALWAYS named imports: `import { useState, useEffect } from "react"` — never default React import
- `ref` is now a regular prop — no `forwardRef` needed
- `use()` hook reads promises and context conditionally
- `useActionState` for form pending states with Server Actions
- Server Components first — push `"use client"` as deep in the tree as possible

### typescript
- NEVER use `any` — use `unknown` for truly unknown types, generics for flexible types
- NEVER inline nested objects in interfaces — create dedicated interfaces for nested shapes
- ALWAYS use const objects + type extraction for string unions: `const STATUS = { ... } as const; type Status = (typeof STATUS)[keyof typeof STATUS]`
- Use `import type { X }` for type-only imports
- Utility types: `Pick`, `Omit`, `Partial`, `Required`, `Record`, `ReturnType`, `Parameters`
- Type guards with `value is Type` return type for narrowing

### tailwind-4
- NEVER use `var()` in className — use Tailwind semantic classes like `bg-primary`
- NEVER use hex colors in className — use Tailwind color scale
- Use `cn()` (clsx + tailwind-merge) for conditional or conflicting classes
- Static classes with no conditions: skip `cn()`, use className directly
- `style` prop only for truly dynamic values (percentages, runtime calculations)
- `var()` constants allowed only for third-party libs that don't accept className (e.g. charts)

### zod-4
- Top-level validators: `z.email()`, `z.uuid()`, `z.url()` — NOT `z.string().email()`
- Error param is `error`, NOT `message`: `z.string({ error: "Required" })`
- `z.string().nonempty()` is gone — use `z.string().min(1)`
- `safeParse` returns `{ success, data }` or `{ success: false, error }` — always prefer over `parse` in API routes
- `z.infer<typeof schema>` for type extraction — never duplicate types

### threejs-fundamentals
- Scene → Camera → Renderer is the minimum setup
- All objects extend `Object3D` — use `.add()` to build hierarchy
- Camera: `PerspectiveCamera(fov, aspect, near, far)` — update aspect on resize
- Renderer: call `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` for retina
- Animation loop: `renderer.setAnimationLoop(callback)` — not `requestAnimationFrame`
- Dispose geometry and material on cleanup to prevent memory leaks

### threejs-shaders
- `ShaderMaterial` for custom GLSL — `uniforms`, `vertexShader`, `fragmentShader`
- Pass time as uniform: `uniforms.uTime.value = clock.getElapsedTime()`
- `varying` passes data from vertex to fragment shader
- `gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0)` always in vertex
- `gl_FragColor = vec4(color, alpha)` always in fragment

### threejs-postprocessing
- `EffectComposer` → `RenderPass` → effect passes chain
- `UnrealBloomPass` for bloom: `(resolution, strength, radius, threshold)`
- Always render composer instead of renderer when post-processing is active: `composer.render()` not `renderer.render()`
- `@react-three/postprocessing` wraps these in declarative React components

### motion
- Use `motion.div`, `motion.span` etc. for animated elements
- `animate`, `initial`, `exit` props for enter/exit animations
- `variants` for reusable animation states
- `useMotionValue` + `useTransform` for scroll-linked or gesture animations
- `AnimatePresence` required for exit animations
- No `framer-motion` import — use `motion` package directly

---

## Project Conventions

- `app/(public)/` — landing page routes (unauthenticated)
- `app/(auth)/` — protected routes (redirect to /login if no session)
- `lib/ai/` — AI providers with round-robin, never call providers directly from API routes
- `lib/search/orchestrator.ts` — single entry point for all search logic
- `lib/supabase/server.ts` for server-side, `lib/supabase/client.ts` for client-side
- `lib/validators/` — all Zod schemas live here, import types with `z.infer`
- `types/` — shared TypeScript types (no Zod, pure TS)
- `components/ui/` — base reusable UI components
- `components/landing/` — landing-specific components including Three.js scene
- Dark background: `#151518` — design is dark mode first
- No `build` command after changes (project rule)
