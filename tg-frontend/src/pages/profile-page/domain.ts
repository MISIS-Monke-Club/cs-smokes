import { z } from "zod"

export const idSchema = z.string().regex(/^\d+$/).transform(Number)
