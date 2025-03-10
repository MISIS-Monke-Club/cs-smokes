import { queryOptions } from "@tanstack/react-query"
import { GrenadeModel } from "./domain"

// TODO: remove mock
const mockGrenades: GrenadeModel[] = [
    {
        grenade_id: 1,
        map_id: 1,
        grenade_class_id: 1,
        type_id: 1,
        link_to_video: "http://example.com/video1",
        user_id: 1,
        created_at: new Date(),
    },
    {
        grenade_id: 2,
        map_id: 2,
        grenade_class_id: 2,
        type_id: 2,
        link_to_video: "http://example.com/video2",
        user_id: 2,
        created_at: new Date(),
    },
    {
        grenade_id: 3,
        map_id: 3,
        grenade_class_id: 3,
        type_id: 3,
        link_to_video: "http://example.com/video3",
        user_id: 3,
        created_at: new Date(),
    },
    {
        grenade_id: 4,
        map_id: 4,
        grenade_class_id: 4,
        type_id: 4,
        link_to_video: "http://example.com/video4",
        user_id: 4,
        created_at: new Date(),
    },
    {
        grenade_id: 5,
        map_id: 5,
        grenade_class_id: 5,
        type_id: 5,
        link_to_video: "http://example.com/video5",
        user_id: 5,
        created_at: new Date(),
    },
    {
        grenade_id: 6,
        map_id: 6,
        grenade_class_id: 6,
        type_id: 6,
        link_to_video: "http://example.com/video6",
        user_id: 6,
        created_at: new Date(),
    },
    {
        grenade_id: 7,
        map_id: 7,
        grenade_class_id: 7,
        type_id: 7,
        link_to_video: "http://example.com/video7",
        user_id: 7,
        created_at: new Date(),
    },
    {
        grenade_id: 8,
        map_id: 8,
        grenade_class_id: 8,
        type_id: 8,
        link_to_video: "http://example.com/video8",
        user_id: 8,
        created_at: new Date(),
    },
    {
        grenade_id: 9,
        map_id: 9,
        grenade_class_id: 9,
        type_id: 9,
        link_to_video: "http://example.com/video9",
        user_id: 9,
        created_at: new Date(),
    },
    {
        grenade_id: 10,
        map_id: 10,
        grenade_class_id: 10,
        type_id: 10,
        link_to_video: "http://example.com/video10",
        user_id: 10,
        created_at: new Date(),
    },
]

export const api = {
    baseKey: "grenade",
    getGrenades: () =>
        queryOptions({
            queryKey: [api.baseKey, "list"],
            // queryFn: () =>
            //     typedQuery(instance.get("/grenades"), grenadeDTOSchema.array())
            //         .then(() => {})
            //         .catch((err) => {
            //             console.error(err)

            //             throw err
            //         }),
            // TODO: remove this placeholder
            queryFn: () =>
                Promise.resolve(mockGrenades).catch((err) => {
                    console.error(err)

                    throw err
                }),
        }),
    getGrenadeById: ({ grenadeId }: { grenadeId: number }) =>
        queryOptions({
            queryKey: [api.baseKey, "ById", grenadeId],
            // queryFn: () =>
            //     typedQuery(
            //         instance.get(`/grenades/${grenadeId}`),
            //         grenadeDTOSchema
            //     ),
            // TODO: remove this mock
            queryFn: () =>
                Promise.resolve(mockGrenades[grenadeId - 1]).catch((err) => {
                    console.error(err)

                    throw err
                }),
        }),
}
