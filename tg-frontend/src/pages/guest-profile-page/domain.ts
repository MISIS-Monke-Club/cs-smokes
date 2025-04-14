import { z } from "zod"

export const guestPageParamSchema = z.object({
    userId: z.string().regex(/^\d+$/).transform(Number),
})
