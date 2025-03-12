import { z } from "zod"

export const grenadeDTOSchema = z.object({
    grenade_id: z.number().int(),
    map_id: z.number().int(),
    grenade_class_id: z.number().int(),
    type_id: z.number().int(),
    link_to_video: z.string(),
    user_id: z.number().int(),
    created_at: z.date(),
})

export type GrenadeModel = z.infer<typeof grenadeDTOSchema>
