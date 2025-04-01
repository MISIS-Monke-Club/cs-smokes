import { MutationOptions } from "@tanstack/react-query"
import { LoginTgModel, LoginTgPostModel } from "./model"
import { loginTgDTOschema } from "./model"
import { fromLoginTgDTO } from "./lib"
import { typedQuery } from "@shared/lib/precooked-methods"
import { client, instance } from "@shared/api"

export const api = {
    baseKey: "session",
    loginTg: (): MutationOptions<LoginTgModel, unknown, LoginTgPostModel> => ({
        mutationKey: [api.baseKey],
        mutationFn: (data) =>
            // typedQuery(instance.post("/login/tg", data), loginTgDTOschema),
            // TODO: delete this mock
            typedQuery({
                request: instance.post("/login/tg/", data),
                dtoSchema: loginTgDTOschema,
                fromDTO: fromLoginTgDTO,
            }),
        onSuccess: () => {
            client.invalidateQueries({
                queryKey: [api.baseKey],
            })
        },
    }),
}
