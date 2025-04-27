import { queryOptions } from "@tanstack/react-query"
import { toast } from "sonner"
import { fromMapArrayDTO, fromMapPageDTO } from "../lib/dto-transformer"
import {
    mapDTOschema,
    MapModel,
    mapPageDTOschema,
    MapPageModel,
} from "../model/domain"
import { typedQuery } from "@shared/lib/precooked-methods"
import { instance } from "@shared/api"

export const api = {
    baseKey: "map",
    baseApiUrl: "maps",
    getMaps: () =>
        queryOptions<MapModel[]>({
            queryKey: [api.baseKey, "list"],
            queryFn: () =>
                typedQuery({
                    request: instance.get(`/${api.baseApiUrl}`),
                    dtoSchema: mapDTOschema.array(),
                    fromDTO: fromMapArrayDTO,
                }).catch((err) => {
                    toast.error("Error acquired while getting maps from server")
                    console.error(err)

                    throw err
                }),
        }),
    getMapById: (mapId: MapModel["mapId"]) =>
        queryOptions<MapPageModel>({
            queryKey: [api.baseKey, "ById", mapId],
            queryFn: () =>
                typedQuery({
                    request: instance.get(`${api.baseApiUrl}/${mapId}`),
                    dtoSchema: mapPageDTOschema,
                    fromDTO: fromMapPageDTO,
                }).catch((err) => {
                    toast.error("Error acquired while getting map from server")
                    console.error(err)

                    throw err
                }),
        }),
}
