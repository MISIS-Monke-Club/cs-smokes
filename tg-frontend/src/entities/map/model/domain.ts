/* eslint-disable @conarti/feature-sliced/layers-slices */
/** Not legally enabling cross import
 * TEST FEATURE!!!
 */
import { z } from "zod"
import { grenadeDTOschema, GrenadeModel } from "@entities/grenade"

export const mapDTOschema = z.object({
    map_id: z.number().positive().min(1),
    name: z.string(),
    link: z.string().nullable(),
    image_link: z.string().nullable(),
})

export const mapPageDTOschema = z
    .object({
        map_lineups: grenadeDTOschema.array(),
    })
    .extend(mapDTOschema.shape)

export type MapModel = {
    mapId: number
    name: string
    link: string | null
    imageLink: string | null
}

export type MapPageModel = MapModel & {
    mapLineups: GrenadeModel[]
}
