import { z } from "zod"
import { GrenadeClassModel, grenadeClassDTOschema } from "./model/domain"

export const fromGrenadeClassDTO = (
    dto: z.infer<typeof grenadeClassDTOschema>
): GrenadeClassModel => {
    return {
        id: dto.grenade_class_id,
        name: dto.name,
        description: dto.description,
        price: dto.price,
    }
}
export const fromGrenadeClassArrayDTO = (
    dto: z.infer<ReturnType<typeof grenadeClassDTOschema.array>>
): GrenadeClassModel[] => {
    return dto.map((el) => fromGrenadeClassDTO(el))
}
