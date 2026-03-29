import { z } from 'zod'
import { searchSchema } from './search.schema'

export const alertSchema = z.object({
  product_name: z.string().min(1, { error: 'Nombre del producto requerido' }).max(200),
  query_data: searchSchema,
  target_price: z.number().positive({ error: 'El precio debe ser positivo' }),
  currency: z.string().regex(/^[A-Z]{3}$/, { error: 'Currency must be a 3-letter ISO 4217 code' }),
})

export type AlertSchemaInput = z.infer<typeof alertSchema>

export const patchAlertSchema = z.object({
  status: z.enum(['active', 'paused', 'triggered']).optional(),
  target_price: z.number().positive().optional(),
}).strict()
