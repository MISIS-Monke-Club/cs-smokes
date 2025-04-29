import { GrenadeModel } from "@entities/grenade"
import { instance } from "@shared/api"

export const api = {
    baseUrl: "favorites",

    deleteFromFavorites: ({ grenadeId }: Pick<GrenadeModel, "grenadeId">) =>
        instance.delete(`/${api.baseUrl}/${grenadeId}`),

    postAddToFavorites: ({ grenadeId }: Pick<GrenadeModel, "grenadeId">) =>
        instance.post(api.baseUrl, { grenadeId }),
}
