import { z } from 'zod'

export const folderSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
})

export type FolderSchemaInput = z.infer<typeof folderSchema>
