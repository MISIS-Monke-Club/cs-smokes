import { z } from "zod"
import { grenadeDTOschema, GrenadeModel } from "../domain"

export const fromGrenadeDTO = (
    dto: z.infer<typeof grenadeDTOschema>
): GrenadeModel => {
    // Transforming dto -> model
    return {
        grenadeId: dto.grenade_id,
        mapId: dto.map_id,
        typeId: dto.type_id,
        grenadeClass: {
            name: dto.grenade_class.name,
            description: dto.grenade_class.description,
            price: dto.grenade_class.price,
        },
        properties: dto.properties.map((el) => ({
            key: el.key,
            values: el.values,
        })),
        linkToVideo: dto.link_to_video,
        userId: dto.user_id,
        createdAt: dto.created_at,
        title: dto.title,
        description: dto.description,
        isApproved: dto.is_approved,
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
