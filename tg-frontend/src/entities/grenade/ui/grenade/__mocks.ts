import { GrenadeModel } from "../../model/domain"

export const grenadeMock: GrenadeModel = {
    grenadeId: 1,
    mapId: 101,
    typeId: 3,
    grenadeClass: {
        name: "Flashbang",
        description:
            "Ослепляющая граната, используется для временного выведения врагов из строя.",
        price: 200,
    },
    properties: [
        { key: "bounce", value: "low" },
        { key: "radius", value: "5m" },
        { key: "duration", value: "2s" },
    ],
    linkToVideo: "https://example.com/videos/flashbang-tutorial",
    userId: 42,
    createdAt: "2025-04-16T10:23:00Z",
    title: "Идеальная флешка на B сайт Mirage",
    description: "Подходит для атаки с мида. Обезвреживает всех за ящиком.",
    isApproved: true,
    views: 1347,
    previewImageLink: "https://example.com/images/flashbang-preview.jpg",
}
