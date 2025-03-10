import { z } from "zod"

export const grenadePageParamsSchema = z.object({
    grenadeId: z.coerce.number().positive().min(1),
})
