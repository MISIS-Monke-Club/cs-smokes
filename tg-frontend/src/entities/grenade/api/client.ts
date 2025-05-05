import { toast } from "sonner"
import { queryOptions } from "@tanstack/react-query"
import { grenadeDTOschema, GrenadeModel } from "../model/domain"
import { fromGrenadeArrayDTO, fromGrenadeDTO } from "../lib/dto-transformer"
import { typedQuery } from "@shared/lib/precooked-methods"
import { instance } from "@shared/api/instance"

export const api = {
    baseKey: ["grenade"],
    baseApiUrl: "lineups",

    getGrenadesByIdOptions: ({ grenadeId }: Pick<GrenadeModel, "grenadeId">) =>
        queryOptions({
            queryKey: [...api.baseKey, { type: "byId", grenadeId }],
            queryFn: () => api.getGrenadeById({ grenadeId }),
        }),

    getGrenadesOptions: () =>
        queryOptions({
            queryKey: [...api.baseKey, { type: "list" }],
            queryFn: api.getGrenades,
        }),

    getGrenades: () =>
        typedQuery({
            request: instance.get(api.baseApiUrl),
            dtoSchema: grenadeDTOschema.array(),
            fromDTO: fromGrenadeArrayDTO,
        }).catch((err) => {
            console.error(err)
            toast.error(
                "Произошла ошибка при получении раскидок, проверьте консоль разработчика"
            )

            throw err
        }),

    getGrenadeById: ({ grenadeId }: Pick<GrenadeModel, "grenadeId">) =>
        typedQuery({
            request: instance.get(`/${api.baseApiUrl}/${grenadeId}`),
            dtoSchema: grenadeDTOschema,
            fromDTO: fromGrenadeDTO,
        }),
}
