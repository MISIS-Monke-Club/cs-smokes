import { fromLoginTgDTO } from "./lib/dto-transformer"
import { loginTgDTOschema } from "./model/domain"
import { instance } from "@shared/api"
import { typedQuery } from "@shared/lib/precooked-methods"

export type LoginTgPostModel = {
    init_data: string
}

export const api = {
    loginTg: (data: LoginTgPostModel) =>
        typedQuery({
            request: instance.post("/login/tg/", data),
            dtoSchema: loginTgDTOschema,
            fromDTO: fromLoginTgDTO,
        }),
}
