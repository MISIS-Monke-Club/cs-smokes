import { z } from "zod"
import { grenadeDTOschema, GrenadeModel } from "./domain"

export const grenadeModelMock: GrenadeModel = {
    grenadeId: 1,
    mapId: 1,
    grenadeClass: {
        name: "Smoke",
        description: "Blocks vision temporarily",
        price: 300,
    },
    propertyList: [
        {
            propertyId: 1,
            name: "длина",
            value: "3",
        },
    ],
    linkToVideo: "https://example.com/video1",
    userId: 101,
    createdAt: "2025-04-01T10:00:00Z",
    title: "Mid Control Smoke",
    description: "Useful for taking mid safely.",
    isApproved: true,
    isFavorite: true,
    views: 230,
    previewImageLink: "https://example.com/image1.jpg",
}

export const grenadesModelMocks: GrenadeModel[] = [
    {
        grenadeId: 1,
        mapId: 101,
        grenadeClass: {
            name: "Flashbang",
            description: "A grenade that blinds enemies.",
            price: 200,
        },
        propertyList: [
            {
                propertyId: 1,
                name: "длина",
                value: "3",
            },
        ],
        linkToVideo: "https://example.com/flashbang-guide",
        userId: 42,
        createdAt: "2024-03-22T12:00:00Z",
        title: "Perfect Flash for Mid Push",
        description:
            "This flashbang is great for rushing mid without getting seen.",
        isApproved: true,
        isFavorite: false,
        views: 1342,
        previewImageLink: "https://example.com/flashbang-preview.jpg",
    },
    {
        grenadeId: 2,
        mapId: 102,
        grenadeClass: {
            name: "Smoke Grenade",
            description:
                "A grenade that creates a vision-blocking smoke screen.",
            price: 300,
        },
        propertyList: [
            {
                propertyId: 1,
                name: "длина",
                value: "3",
            },
        ],
        linkToVideo: "https://example.com/smoke-setup",
        userId: 67,
        createdAt: "2024-03-20T15:30:00Z",
        title: "One-Way Smoke on Mirage",
        description: "A powerful one-way smoke for jungle control.",
        isApproved: false,
        isFavorite: true,
        views: 823,
        previewImageLink: "https://example.com/smoke-preview.jpg",
    },
]

export const grenadeDTOmock: z.infer<typeof grenadeDTOschema> = {
    grenade_id: 1,
    map_id: 1,
    grenade_class: {
        name: "Smoke",
        description: "Blocks vision temporarily",
        price: 300,
    },
    property_list: [
        {
            property_id: 1,
            name: "длина",
            value: "3",
        },
    ],
    link_to_video: "https://example.com/video1",
    user_id: 101,
    created_at: "2025-04-01T10:00:00Z",
    title: "Mid Control Smoke",
    description: "Useful for taking mid safely.",
    is_approved: true,
    is_favorite: true,
    views: 230,
    preview_image_link: "https://example.com/image1.jpg",
}

export const grenadesDTOmock: z.infer<
    ReturnType<typeof grenadeDTOschema.array>
> = [
    { ...grenadeDTOmock },
    {
        grenade_id: 2,
        map_id: 102,
        grenade_class: {
            name: "Smoke Grenade",
            description:
                "A grenade that creates a vision-blocking smoke screen.",
            price: 300,
        },
        property_list: [
            {
                property_id: 1,
                name: "длина",
                value: "3",
            },
        ],
        link_to_video: "https://example.com/smoke-setup",
        user_id: 67,
        created_at: "2024-03-20T15:30:00Z",
        title: "One-Way Smoke on Mirage",
        description: "A powerful one-way smoke for jungle control.",
        is_approved: false,
        is_favorite: false,
        views: 823,
        preview_image_link: "https://example.com/smoke-preview.jpg",
    },
]
