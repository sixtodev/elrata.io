import { z } from 'zod'

export const searchSchema = z.object({
  product: z.string().min(1, 'Producto requerido').max(200),
  brand: z.string().max(100).optional(),
  city: z.string().min(1, 'Ciudad requerida').max(100),
  country: z.string().min(1, 'País requerido').max(100),
  purpose: z.string().min(1, 'Propósito requerido').max(500),
  model: z.enum(['claude-sonnet-4-6', 'gpt-4o', 'gemini-2.5-pro']).optional(),
  budget: z.string().max(50).optional(),
  source: z.enum(['all', 'mercadolibre', 'web']).optional(),
})

export type SearchSchemaInput = z.infer<typeof searchSchema>
