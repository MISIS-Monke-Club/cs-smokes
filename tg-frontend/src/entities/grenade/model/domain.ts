import { ReactNode } from "react"
import { z } from "zod"

export const grenadeDTOschema = z.object({
    grenade_id: z.number().int(),
    map_id: z.number().int(),
    grenade_class: z.object({
        grenade_class_id: z.number(),
        name: z.string(),
        description: z.string(),
        price: z.number().positive().min(1),
    }),
    property_list: z.array(
        z.object({
            property_id: z.number(),
            name: z.string(),
            value: z.string(),
        })
    ),
    link_to_video: z.string().url().nullable(),
    creator: z.object({
        user_id: z.number().positive(),
        username: z.string(),
        avatar_url: z.string().nullable(),
        first_name: z.string().nullable(),
        last_name: z.string().nullable(),
    }),
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
        grenadeClassId: number
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
    creator: {
        userId: number
        username: string
        avatarUrl: string | null
        firstName: string | null
        lastName: string | null
    }
    createdAt: string
    title: string
    description: string | null
    isApproved: boolean
    isFavorite: boolean
    views: number
    previewImageLink: string | null
}

export type GrenadesListMaper = (elements: GrenadeModel[]) => ReactNode
