import { queryOptions } from "@tanstack/react-query"
import { toast } from "sonner"
import { grenadeDTOschema, GrenadeModel } from "../model/domain"
import { fromGrenadeArrayDTO, fromGrenadeDTO } from "../lib/dto-transformer"
import { typedQuery } from "@shared/lib/precooked-methods"
import { instance } from "@shared/api/instance"

export const api = {
    baseKey: ["grenade"],
    baseApiUrl: "grenades",
    getGrenades: () =>
        queryOptions<GrenadeModel[]>({
            queryKey: [...api.baseKey, "list"],
            queryFn: () =>
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
        }),
    getGrenadeById: ({ grenadeId }: { grenadeId: number }) =>
        queryOptions<GrenadeModel>({
            queryKey: [...api.baseKey, "ById", grenadeId],
            queryFn: () =>
                typedQuery({
                    request: instance.get(`/${api.baseApiUrl}/${grenadeId}`),
                    dtoSchema: grenadeDTOschema,
                    fromDTO: fromGrenadeDTO,
                }).catch((err) => {
                    console.error(err)
                    toast.error(
                        `Произошла ошибка при получении раскидки с id: ${grenadeId}, проверьте консоль разработчика`
                    )

                    throw err
                }),
        }),
}
