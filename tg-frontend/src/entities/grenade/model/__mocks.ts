import { GrenadeModel } from "./domain"

export const grenadeModelMock: GrenadeModel = {
    grenadeId: 1,
    mapId: 1,
    typeId: 1,
    grenadeClass: {
        name: "Smoke",
        description: "Blocks vision temporarily",
        price: 300,
    },
    propertyList: [
        { key: "bounce", value: "medium" },
        { key: "duration", value: "18s" },
    ],
    linkToVideo: "https://example.com/video1",
    userId: 101,
    createdAt: "2025-04-01T10:00:00Z",
    title: "Mid Control Smoke",
    description: "Useful for taking mid safely.",
    isApproved: true,
    views: 230,
    previewImageLink: "https://example.com/image1.jpg",
}

export const grenadesModelMocks: GrenadeModel[] = [
    {
        grenadeId: 1,
        mapId: 101,
        typeId: 5,
        grenadeClass: {
            name: "Flashbang",
            description: "A grenade that blinds enemies.",
            price: 200,
        },
        propertyList: [
            { key: "effect_duration", value: "2.5s" },
            { key: "radius", value: "400 units" },
        ],
        linkToVideo: "https://example.com/flashbang-guide",
        userId: 42,
        createdAt: "2024-03-22T12:00:00Z",
        title: "Perfect Flash for Mid Push",
        description:
            "This flashbang is great for rushing mid without getting seen.",
        isApproved: true,
        views: 1342,
        previewImageLink: "https://example.com/flashbang-preview.jpg",
    },
    {
        grenadeId: 2,
        mapId: 102,
        typeId: 6,
        grenadeClass: {
            name: "Smoke Grenade",
            description:
                "A grenade that creates a vision-blocking smoke screen.",
            price: 300,
        },
        propertyList: [
            { key: "duration", value: "18s" },
            { key: "radius", value: "500 units" },
        ],
        linkToVideo: "https://example.com/smoke-setup",
        userId: 67,
        createdAt: "2024-03-20T15:30:00Z",
        title: "One-Way Smoke on Mirage",
        description: "A powerful one-way smoke for jungle control.",
        isApproved: false,
        views: 823,
        previewImageLink: "https://example.com/smoke-preview.jpg",
    },
]
