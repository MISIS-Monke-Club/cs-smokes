import { MutationOptions } from "@tanstack/react-query"
import { LineupFormData, convertToApiLineup } from "./model"
import { instance, client } from "@shared/api"

type CreateLineupParams = {
    data: LineupFormData
    userId: number
}

export const api = {
    baseUrl: "/lineups",
    baseKey: "lineups",

    createLineup: (): MutationOptions<
        unknown,
        unknown,
        CreateLineupParams
    > => ({
        mutationFn: async ({ data, userId }) => {
            const payload = convertToApiLineup(data, userId)
            await instance.post(api.baseUrl, payload)
        },
        onSuccess: () => {
            client.invalidateQueries({
                queryKey: [api.baseKey],
            })
        },
    }),
}
