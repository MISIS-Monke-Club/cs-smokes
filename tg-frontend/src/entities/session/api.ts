import { MutationOptions } from "@tanstack/react-query"
import { AxiosResponse } from "axios"
import { LoginTgModel, LoginTgPostModel } from "./model"
import { loginTgDTOschema } from "./model"
import { fromLoginTgDTO } from "./lib"
import { typedQuery } from "@shared/lib/precooked-methods"
import { client } from "@shared/api"

export const api = {
    baseKey: "session",
    loginTg: (): MutationOptions<LoginTgModel, unknown, LoginTgPostModel> => ({
        mutationKey: [api.baseKey],
        mutationFn: () =>
            // typedQuery(instance.post("/login/tg", data), loginTgDTOschema),
            // TODO: delete this mock
            typedQuery({
                request: Promise.resolve({
                    data: {
                        token: "123",
                        userId: 1,
                    },
                    headers: {},
                    request: {},
                    status: 0,
                    statusText: "",
                    config: {} as any,
                } satisfies AxiosResponse),
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
