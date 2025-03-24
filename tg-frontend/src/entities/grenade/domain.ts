import { z } from "zod"

export const grenadeDTOschema = z.object({
    grenade_id: z.number().int(),
    map_id: z.number().int(),
    type_id: z.number().int(),
    grenade_class: z.object({
        name: z.string(),
        description: z.string(),
        price: z.number().positive().min(1),
    }),
    properties: z
        .object({
            key: z.string(),
            value: z.string(),
        })
        .array(),
    link_to_video: z.string().url().nullable(),
    user_id: z.number().positive(),
    created_at: z.string().datetime(),
    title: z.string(),
    description: z.string().nullable(),
    is_approved: z.boolean(),
    views: z.number().positive(),
    preview_image_link: z.string().nullable(),
})

export type GrenadeModel = {
    grenadeId: number
    mapId: number
    typeId: number
    grenadeClass: {
        name: string
        description: string
        price: number
    }
    properties: {
        key: string
        value: string
    }[]
    linkToVideo: string | null
    userId: number
    createdAt: string
    title: string
    description: string | null
    isApproved: boolean
    views: number
    previewImageLink: string | null
}
