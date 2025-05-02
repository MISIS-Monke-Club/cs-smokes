import { z } from "zod"
import { loginTgDTOschema, LoginTgModel } from "../model/domain"
import { fromUserDTO } from "@entities/user"

export const fromLoginTgDTO = (
    dto: z.infer<typeof loginTgDTOschema>
): LoginTgModel => ({
    user: fromUserDTO(dto.user),
    accessToken: dto.access_token,
    refreshToken: dto.access_token,
})
