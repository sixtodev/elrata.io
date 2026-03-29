import { z } from 'zod'

export const userStoreSchema = z.object({
  url: z.url({ error: 'URL inválida' }),
  name: z.string().max(100).optional(),
})

export type UserStoreSchemaInput = z.infer<typeof userStoreSchema>

export const patchUserStoreSchema = z.object({
  name: z.string().max(100).optional(),
  url: z.url({ error: 'URL inválida' }).optional(),
}).refine(
  (d) => d.name !== undefined || d.url !== undefined,
  { message: 'At least one of name or url must be provided' }
)
