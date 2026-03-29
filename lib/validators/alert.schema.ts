import { z } from 'zod'
import { searchSchema } from './search.schema'

export const alertSchema = z.object({
  product_name: z.string().min(1, { error: 'Nombre del producto requerido' }).max(200),
  query_data: searchSchema,
  target_price: z.number().positive({ error: 'El precio debe ser positivo' }),
  currency: z.string().min(1).max(10),
})

export type AlertSchemaInput = z.infer<typeof alertSchema>
