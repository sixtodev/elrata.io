import { z } from 'zod'

export const userStoreSchema = z.object({
  url: z.url({ error: 'URL inválida' }),
  name: z.string().max(100).optional(),
})

export type UserStoreSchemaInput = z.infer<typeof userStoreSchema>
