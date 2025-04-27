import { z } from "zod"
import { mapDTOschema } from "../../model/domain"

export const testData: z.infer<ReturnType<typeof mapDTOschema.array>> = [
    {
        map_id: 1,
        name: "Dust II",
        link: "https://example.com/dust2",
        image_link: "https://example.com/images/dust2.jpg",
    },
    {
        map_id: 2,
        name: "Inferno",
        link: "https://example.com/inferno",
        image_link: "https://example.com/images/inferno.jpg",
    },
    {
        map_id: 3,
        name: "Mirage",
        link: null, // Отсутствует ссылка
        image_link: "https://example.com/images/mirage.jpg",
    },
    {
        map_id: 4,
        name: "Nuke",
        link: "https://example.com/nuke",
        image_link: null, // Отсутствует изображение
    },
    {
        map_id: 5,
        name: "Overpass",
        link: "https://example.com/overpass",
        image_link: "https://example.com/images/overpass.jpg",
    },
]
