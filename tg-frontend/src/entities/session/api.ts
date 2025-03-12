import { instance } from "@shared/api"
import { typedQuery } from "@shared/lib/precooked-methods"
import { MutationOptions } from "@tanstack/react-query"
import { loginTgDTOschema, LoginTgModel, LoginTgPostModel } from "./model"

export const api = {
    baseKey: "session",
    loginTg: (): MutationOptions<LoginTgModel, unknown, LoginTgPostModel> => ({
        mutationKey: [api.baseKey],
        mutationFn: (data) =>
            typedQuery(instance.post("/login/tg", data), loginTgDTOschema),
    }),
}
