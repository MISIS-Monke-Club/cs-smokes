import { z } from "zod"

export const grenadeClassDTOschema = z.object({
    grenade_class_id: z.number(),
    name: z.string(),
    description: z.string(),
    price: z.number(),
})

export type GrenadeClassModel = {
    id: number
    name: string
    description: string
    price: number
}
