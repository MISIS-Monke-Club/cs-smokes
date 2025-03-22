import { MutationOptions } from "@tanstack/react-query"
import { LoginTgModel, LoginTgPostModel } from "./model/domain"
import { loginTgDTOschema } from "./model/domain"
import { typedQuery } from "@shared/lib/precooked-methods"
import { instance } from "@shared/api"

export const api = {
    baseKey: "session",
    loginTg: (): MutationOptions<LoginTgModel, unknown, LoginTgPostModel> => ({
        mutationKey: [api.baseKey],
        mutationFn: (data) =>
            typedQuery(instance.post("/login/tg", data), loginTgDTOschema),
    }),
}
