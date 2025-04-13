import { MutationOptions } from "@tanstack/react-query"
import { LineupFormData, mapNameToId } from "./model"
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
        mutationFn: ({ data, userId }) => {
            return instance.post(api.baseUrl, {
                title: data.title,
                description: data.description,
                map_id: mapNameToId[data.map],
                link_to_video: data.link_to_video,
                preview_image_link: data.preview_image_link,
                user_id: userId,
            })
        },
        onSuccess: () => {
            client.invalidateQueries({
                queryKey: [api.baseKey],
            })
        },
    }),
}
