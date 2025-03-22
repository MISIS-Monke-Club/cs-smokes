import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"
import { AxiosResponse } from "axios"
import { toast } from "sonner"
import { fromMapArrayDTO, fromMapPageDTO } from "./lib/dto-transformer"
import { mapDTOschema, MapModel, mapPageDTOschema } from "./model"
import { typedQuery } from "@shared/lib/precooked-methods"
// TODO: remove this
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { grenadeDTOschema } from "@entities/grenade"

// TODO: remove this mocks
export const mockGrenadeData: z.infer<
    ReturnType<typeof grenadeDTOschema.array>
> = [
    {
        grenade_id: 1,
        map_id: 101,
        type_id: 5,
        grenade_class: {
            name: "Flashbang",
            description: "A grenade that blinds enemies.",
            price: 200,
        },
        properties: [
            { key: "effect_duration", values: "2.5s" },
            { key: "radius", values: "400 units" },
        ],
        link_to_video: "https://example.com/flashbang-guide",
        user_id: 42,
        created_at: "2024-03-22T12:00:00Z",
        title: "Perfect Flash for Mid Push",
        description:
            "This flashbang is great for rushing mid without getting seen.",
        is_approved: true,
        views: 1342,
        preview_image_link: "https://example.com/flashbang-preview.jpg",
    },
    {
        grenade_id: 2,
        map_id: 102,
        type_id: 6,
        grenade_class: {
            name: "Smoke Grenade",
            description:
                "A grenade that creates a vision-blocking smoke screen.",
            price: 300,
        },
        properties: [
            { key: "duration", values: "18s" },
            { key: "radius", values: "500 units" },
        ],
        link_to_video: "https://example.com/smoke-setup",
        user_id: 67,
        created_at: "2024-03-20T15:30:00Z",
        title: "One-Way Smoke on Mirage",
        description: "A powerful one-way smoke for jungle control.",
        is_approved: false,
        views: 823,
        preview_image_link: "https://example.com/smoke-preview.jpg",
    },
]
export const mockMapData: z.infer<ReturnType<typeof mapDTOschema.array>> = [
    {
        map_id: 101,
        name: "Dust II",
        image_link: "https://example.com/maps/dust2.jpg",
        link: "https://example.com/maps/dust2.jpg",
    },
    {
        map_id: 102,
        name: "Inferno",
        image_link: "https://example.com/maps/inferno.jpg",
        link: "https://example.com/maps/inferno.jpg",
    },
    {
        map_id: 3,
        name: "Mirage",
        image_link: "https://example.com/maps/mirage.jpg",
        link: "https://example.com/maps/mirage.jpg",
    },
    {
        map_id: 4,
        name: "Nuke",
        image_link: "https://example.com/maps/nuke.jpg",
        link: "https://example.com/maps/nuke.jpg",
    },
    {
        map_id: 5,
        name: "Overpass",
        image_link: "https://example.com/maps/overpass.jpg",
        link: "https://example.com/maps/overpass.jpg",
    },
]
export const mockMapPageData: z.infer<ReturnType<typeof mapDTOschema.array>> =
    mockMapData.map((map) => ({
        ...map,
        map_lineups: mockGrenadeData.filter(
            (grenade) => grenade.map_id === map.map_id
        ),
    }))

export const api = {
    baseKey: "map",
    getMaps: () =>
        queryOptions({
            queryKey: [api.baseKey, "list"],
            queryFn: () =>
                typedQuery({
                    // request: instance.get("/maps"),
                    // TODO: Remove this mocks
                    request: Promise.resolve({
                        data: mockMapData,
                        headers: {},
                        request: {},
                        status: 0,
                        statusText: "",
                        config: {} as any,
                    } satisfies AxiosResponse),
                    dtoSchema: mapDTOschema.array(),
                    fromDTO: fromMapArrayDTO,
                }),
        }),
    getMapById: (mapId: MapModel["mapId"]) =>
        queryOptions({
            queryKey: [api.baseKey, "ById", mapId],
            queryFn: () =>
                typedQuery({
                    // request: instance.get(`/maps/${mapId}`),
                    // TODO: remove this mocks
                    request: Promise.resolve({
                        data: mockMapPageData[mapId - 1],
                        headers: {},
                        request: {},
                        status: 0,
                        statusText: "",
                        config: {} as any,
                    } satisfies AxiosResponse),
                    dtoSchema: mapPageDTOschema,
                    fromDTO: fromMapPageDTO,
                }).catch((err) => {
                    toast.error("Error acquired while getting map from server")
                    console.error(err)

                    throw err
                }),
        }),
}
