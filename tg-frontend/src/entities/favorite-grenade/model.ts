/**
 * WARNING!
 * Test feature
 * In FSD you cant cross import entities
 */
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { grenadeDTOschema, GrenadeModel } from "@entities/grenade"

export const favoriteDTOschema = grenadeDTOschema

export type FavoriteModel = GrenadeModel
