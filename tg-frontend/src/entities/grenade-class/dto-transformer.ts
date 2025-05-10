import { GrenadeClassModel } from "./model/domain"

type GrenadeClassDTO = {
    grenade_class_id: number
    name: string
    description: string
    price: number
}

export const fromGrenadeClassArrayDTO = (
    dto: GrenadeClassDTO[]
): GrenadeClassModel[] =>
    dto.map((item) => ({
        id: item.grenade_class_id,
        name: item.name,
        description: item.description,
        price: item.price,
    }))
