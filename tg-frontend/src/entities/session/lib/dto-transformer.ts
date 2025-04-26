import { z } from "zod"
import { loginTgDTOschema, LoginTgModel } from "../model/domain"

export const fromLoginTgDTO = (
    dto: z.infer<typeof loginTgDTOschema>
): LoginTgModel => ({
    userId: dto.user_id,
    authToken: dto.auth_token,
    refreshToken: dto.refresh_token,
})
