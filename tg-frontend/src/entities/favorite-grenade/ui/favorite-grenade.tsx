import { FavoriteModel } from "../model"
/**
 * WARNING!
 * Test feature
 * In FSD you cant cross import entities
 * Doing this because i got full copy of grenade (favorite grenade),
 * but with specific api
 */
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { Grenade } from "@entities/grenade"

type FavoriteGrenadeProps = {
    favoriteGrenade: FavoriteModel
}

export function FavoriteGrenade({ favoriteGrenade }: FavoriteGrenadeProps) {
    return (
        <>
            <Grenade grenade={favoriteGrenade} />
        </>
    )
}
