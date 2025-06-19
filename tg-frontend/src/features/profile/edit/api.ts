import { PatchUserByIdParams } from "./model"
import { userApi } from "@entities/user"
import { instance } from "@shared/api"

export const api = {
    ...userApi,
    patchUserById: ({ userData, userId }: PatchUserByIdParams) =>
        instance.patch(`${api.baseUrl}/${userId}`, userData),
}
