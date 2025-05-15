import { queryOptions } from "@tanstack/react-query"
import { toast } from "sonner"
import { fromMapArrayDTO, fromMapPageDTO } from "../lib/dto-transformer"
import {
    mapDTOschema,
    MapId,
    MapModel,
    mapPageDTOschema,
    MapPageModel,
} from "../model/domain"
import { typedQuery } from "@shared/lib/precooked-methods"
import { instance } from "@shared/api"

export const api = {
    baseKey: ["map"],
    baseApiUrl: "maps",
    getMapsOptions: (params?: { query?: string }) =>
        queryOptions<MapModel[]>({
            queryKey: [...api.baseKey, { type: "list" }, params],
            queryFn: () => api.getMaps(params),
        }),

    getMapByIdOptions: (mapId: MapModel["mapId"]) =>
        queryOptions<MapPageModel>({
            queryKey: [...api.baseKey, { type: "byId", mapId }],
            queryFn: () => api.getMapsById(mapId),
        }),

    getMaps: (params?: { query?: string }) =>
        typedQuery({
            request: instance.get(api.baseApiUrl, {
                params,
            }),
            dtoSchema: mapDTOschema.array(),
            fromDTO: fromMapArrayDTO,
        }).catch((err) => {
            toast.error("Error acquired while getting maps from server")
            console.error(err)

            throw err
        }),

    getMapsById: (mapId: MapId) =>
        typedQuery({
            request: instance.get(`${api.baseApiUrl}/${mapId}`),
            dtoSchema: mapPageDTOschema,
            fromDTO: fromMapPageDTO,
        }).catch((err) => {
            toast.error("Error acquired while getting map from server")
            console.error(err)

            throw err
        }),
}
