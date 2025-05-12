import { ReactNode } from "react"
import { z } from "zod"

export const grenadeDTOschema = z.object({
    grenade_id: z.number().int(),
    map_id: z.number().int(),
    grenade_class: z.object({
        name: z.string(),
        description: z.string(),
        price: z.number().positive().min(1),
    }),
    property_list: z
        .object({
            property_id: z.number(),
            name: z.string(),
            value: z.string(),
        })
        .array(),
    link_to_video: z.string().url().nullable(),
    user_id: z.number().positive(),
    created_at: z.string().datetime(),
    title: z.string(),
    description: z.string().nullable(),
    is_approved: z.boolean(),
    is_favorite: z.boolean(),
    views: z.number(),
    preview_image_link: z.string().nullable(),
})

export type GrenadeModel = {
    grenadeId: number
    mapId: number
    grenadeClass: {
        name: string
        description: string
        price: number
    }
    propertyList: {
        propertyId: number
        name: string
        value: string
    }[]
    linkToVideo: string | null
    userId: number
    createdAt: string
    title: string
    description: string | null
    isApproved: boolean
    isFavorite: boolean
    views: number
    previewImageLink: string | null
}

export type GrenadesListMaper = (elements: GrenadeModel[]) => ReactNode
