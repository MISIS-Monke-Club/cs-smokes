import { z } from "zod"
import { favoriteDTOschema, FavoriteModel } from "../model"
/**
 * WARNING!
 * Test feature
 * In FSD you cant cross import entities
 * Doing this because i got full copy of grenade (favorite grenade),
 * but with specific api
 */
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { fromGrenadeDTO } from "@entities/grenade"

export const fromFavoriteDto = (
    el: z.infer<typeof favoriteDTOschema>
): FavoriteModel => fromGrenadeDTO(el)
