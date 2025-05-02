import { z } from "zod"
import {
    mapDTOschema,
    MapModel,
    mapPageDTOschema,
    MapPageModel,
} from "../model/domain"
/** Not legally enabling cross import
 * TEST FEATURE!!!
 */
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { fromGrenadeArrayDTO } from "@entities/grenade"

export const fromMapDTO = (dto: z.infer<typeof mapDTOschema>): MapModel => {
    return {
        mapId: dto.map_id,
        name: dto.name,
        link: dto.link,
        imageLink: dto.image_link,
    }
}

export const fromMapPageDTO = (
    dto: z.infer<typeof mapPageDTOschema>
): MapPageModel => {
    return {
        ...fromMapDTO(dto),
        mapLineups: fromGrenadeArrayDTO(dto.map_lineups),
    }
}

export const fromMapArrayDTO = (
    dto: z.infer<ReturnType<typeof mapDTOschema.array>>
): MapModel[] => {
    const arr: MapModel[] = dto.map((el) => fromMapDTO(el))

    return arr
}
