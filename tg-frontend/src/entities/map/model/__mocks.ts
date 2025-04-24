import { z } from "zod"
import { mapDTOschema, mapPageDTOschema } from "../model/domain"

/**
 * @warning Test feature to cross import model, not allowed in FSD
 */
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { grenadesDTOmock } from "@entities/grenade"

export const mockMaps: z.infer<ReturnType<typeof mapDTOschema.array>> = [
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

export const mockMapPage: z.infer<typeof mapPageDTOschema> = {
    image_link:
        "https://www.google.com/imgres?q=grenade%20image&imgurl=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2F2%2F20%2FMkII_07.JPG&imgrefurl=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FMk_2_grenade&docid=rOjuf5ciTh6aqM&tbnid=hOkxScoNe7UFGM&vet=12ahUKEwja-Ka-zLSMAxXiHBAIHb1RGLAQM3oECBcQAA..i&w=1200&h=1638&hcb=2&itg=1&ved=2ahUKEwja-Ka-zLSMAxXiHBAIHb1RGLAQM3oECBcQAA",
    link: "https://google.com",
    map_id: 1,
    name: "Dust 2",
    map_lineups: [...grenadesDTOmock],
}
