import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"
import { AxiosResponse } from "axios"
import { grenadeDTOschema } from "./domain"
import { fromGrenadeArrayDTO, fromGrenadeDTO } from "./lib/dto-transformer"
import { typedQuery } from "@shared/lib/precooked-methods"

// TODO: remove mock
const mockGrenades: z.infer<ReturnType<typeof grenadeDTOschema.array>> = [
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
            { key: "effect_duration", value: "2.5s" },
            { key: "radius", value: "400 units" },
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
            { key: "duration", value: "18s" },
            { key: "radius", value: "500 units" },
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

export const api = {
    baseKey: "grenade",
    getGrenades: () =>
        queryOptions({
            queryKey: [api.baseKey, "list"],
            queryFn: () =>
                typedQuery({
                    // request: instance.get("/grenades")
                    // TODO: Remove this mocks
                    request: Promise.resolve({
                        data: mockGrenades,
                        headers: {},
                        request: {},
                        status: 0,
                        statusText: "",
                        config: {} as any,
                    } satisfies AxiosResponse),
                    dtoSchema: grenadeDTOschema.array(),
                    fromDTO: fromGrenadeArrayDTO,
                }),
        }),
    getGrenadeById: ({ grenadeId }: { grenadeId: number }) =>
        queryOptions({
            queryKey: [api.baseKey, "ById", grenadeId],
            queryFn: () =>
                typedQuery({
                    // request: instance.get(`/grenades/${grenadeId}`),
                    // TODO: remove this mock
                    request: Promise.resolve({
                        data: mockGrenades[grenadeId - 1],
                        headers: {},
                        request: {},
                        status: 0,
                        statusText: "",
                        config: {} as any,
                    } satisfies AxiosResponse),
                    dtoSchema: grenadeDTOschema,
                    fromDTO: fromGrenadeDTO,
                }),
        }),
}
