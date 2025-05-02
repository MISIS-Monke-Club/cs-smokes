import { favoriteApi } from "@entities/favorite"
import { grenadeApi, GrenadeModel } from "@entities/grenade"
import { instance } from "@shared/api"

export const api = {
    ...favoriteApi,
    baseKey: [...grenadeApi.baseKey, ...favoriteApi.baseKey],

    postAddToFavorites: ({ grenadeId }: Pick<GrenadeModel, "grenadeId">) =>
        instance.post(api.baseUrl, { grenadeId }),

    deleteFromFavorites: ({ grenadeId }: Pick<GrenadeModel, "grenadeId">) =>
        instance.delete(`${api.baseUrl}/${grenadeId}`),
}
