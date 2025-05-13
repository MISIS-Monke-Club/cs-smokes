import { MutationOptions } from "@tanstack/react-query"
import { LineupFormData, convertToApiLineup } from "./model"
import { instance, client } from "@shared/api"
import { grenadeApi } from "@entities/grenade"

type CreateLineupParams = {
    data: LineupFormData
    userId: number
}

export const api = {
    ...grenadeApi,
    baseUrl: "/lineups/",
    baseKey: "lineups",

    createLineup: (): MutationOptions<
        unknown,
        unknown,
        CreateLineupParams
    > => ({
        mutationFn: async ({ data, userId }) => {
            const payload = convertToApiLineup(data, userId)
            await instance.post(api.baseUrl, payload)
            return payload
        },
        onSuccess: (_, variables) => {
            client.invalidateQueries({ queryKey: ["lineups"] })
            client.invalidateQueries({
                queryKey: [
                    "map",
                    { type: "byId", mapId: variables.data.map_id },
                ],
            })
        },
    }),
}
