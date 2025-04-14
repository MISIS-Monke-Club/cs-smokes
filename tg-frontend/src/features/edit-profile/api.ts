import { MutationOptions } from "@tanstack/react-query"
import { PatchUserByIdParams } from "./model"
import { userApi, UserModel } from "@entities/user"
import { instance, client } from "@shared/api"

export const api = {
    ...userApi,
    patchUserById: (): MutationOptions<
        UserModel,
        unknown,
        PatchUserByIdParams
    > => ({
        mutationFn: (params) =>
            instance.patch(`${api.baseUrl}/${params.userId}`, params.userData),
        onSuccess: (_, params) => {
            client.invalidateQueries({
                queryKey: [api.baseKey, "ById", params.userId],
            })
        },
    }),
}
