import { z } from "zod"

export const mapPageParamsSchema = z.object({
    mapId: z.coerce.number().positive().min(1),
})
