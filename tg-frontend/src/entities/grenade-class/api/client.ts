import { toast } from "sonner"
import { queryOptions } from "@tanstack/react-query"
import { grenadeClassDTOschema, GrenadeClassModel } from "../model/domain"
import { fromGrenadeClassArrayDTO } from "../dto-transformer"
import { instance } from "@shared/api"
import { typedQuery } from "@shared/lib/precooked-methods"

export const api = {
    baseKey: ["grenade-class"],
    baseApiUrl: "grenade-classes",

    getGrenadeClasses: () =>
        typedQuery({
            request: instance.get(api.baseApiUrl),
            dtoSchema: grenadeClassDTOschema.array(),
            fromDTO: fromGrenadeClassArrayDTO,
        }).catch((err) => {
            console.error(err)
            toast.error(
                "Произошла ошибка при получении классов гранат, проверьте консоль разработчика"
            )
            throw err
        }),

    getGrenadeClassOptions: () =>
        queryOptions<GrenadeClassModel[]>({
            queryKey: [...api.baseKey, { type: "list" }],
            queryFn: api.getGrenadeClasses,
        }),
}
