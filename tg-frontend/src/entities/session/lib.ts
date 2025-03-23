import { z } from "zod"
import { loginTgDTOschema, LoginTgModel } from "./model"

export const fromLoginTgDTO = (
    el: z.infer<typeof loginTgDTOschema>
): LoginTgModel => {
    return {
        token: el.token,
        userId: el.User_ID,
    }
}
