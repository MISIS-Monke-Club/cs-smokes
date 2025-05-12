import { z } from "zod"
import { grenadeDTOschema, GrenadeModel } from "../model/domain"

export const fromGrenadeDTO = (
    dto: z.infer<typeof grenadeDTOschema>
): GrenadeModel => {
    // Transforming dto -> model
    return {
        grenadeId: dto.grenade_id,
        mapId: dto.map_id,
        grenadeClass: {
            name: dto.grenade_class.name,
            description: dto.grenade_class.description,
            price: dto.grenade_class.price,
        },
        propertyList: dto.property_list.map((el) => ({
            propertyId: el.property_id,
            name: el.name,
            value: el.name,
        })),
        linkToVideo: dto.link_to_video,
        userId: dto.user_id,
        createdAt: dto.created_at,
        title: dto.title,
        description: dto.description,
        isApproved: dto.is_approved,
        isFavorite: dto.is_favorite,
        views: dto.views,
        previewImageLink: dto.preview_image_link,
    }
}

export const fromGrenadeArrayDTO = (
    dto: z.infer<ReturnType<typeof grenadeDTOschema.array>>
): GrenadeModel[] => {
    // Transforming dto[] -> model[]
    const arr: GrenadeModel[] = dto.map((el) => fromGrenadeDTO(el))

    return arr
}
