import { queryOptions } from "@tanstack/react-query"
import { toast } from "sonner"
import { fromMapArrayDTO, fromMapPageDTO } from "./lib/dto-transformer"
import { mapDTOschema, MapModel, mapPageDTOschema } from "./model"
import { typedQuery } from "@shared/lib/precooked-methods"
import { instance } from "@shared/api"

export const api = {
    baseKey: "map",
    getMaps: () =>
        queryOptions({
            queryKey: [api.baseKey, "list"],
            queryFn: () =>
                typedQuery({
                    request: instance.get("/maps"),
                    dtoSchema: mapDTOschema.array(),
                    fromDTO: fromMapArrayDTO,
                }).catch((err) => {
                    toast.error("Error acquired while getting maps from server")
                    console.error(err)

                    throw err
                }),
        }),
    getMapById: (mapId: MapModel["mapId"]) =>
        queryOptions({
            queryKey: [api.baseKey, "ById", mapId],
            queryFn: () =>
                typedQuery({
                    request: instance.get(`/maps/${mapId}`),
                    dtoSchema: mapPageDTOschema,
                    fromDTO: fromMapPageDTO,
                }).catch((err) => {
                    toast.error("Error acquired while getting map from server")
                    console.error(err)

                    throw err
                }),
        }),
}
