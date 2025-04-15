import { z } from "zod"

export const mapOptions = [
    "Dust2",
    "Mirage",
    "Inferno",
    "Nuke",
    "Overpass",
    "Vertigo",
    "Ancient",
    "Train",
] as const

export const mapNameToId: Record<(typeof mapOptions)[number], number> = {
    Dust2: 1,
    Mirage: 2,
    Inferno: 3,
    Nuke: 4,
    Overpass: 5,
    Vertigo: 6,
    Ancient: 7,
    Train: 8,
}

export const lineupSchema = z.object({
    title: z
        .string()
        .min(3, "Название должно содержать минимум 3 символа")
        .max(100, "Название слишком длинное"),
    description: z
        .string()
        .min(10, "Описание должно содержать минимум 10   символов")
        .max(1000, "Описание слишком длинное"),
    map: z.enum(mapOptions),
    link_to_video: z
        .string()
        .url("Введите корректную ссылку")
        .refine(
            (url) => url.includes("youtube.com") || url.includes("rutube.ru"),
            {
                message: "Ссылка должна вести на YouTube или Rutube",
            }
        ),
    preview_image_link: z
        .string()
        .url("Введите корректную ссылку на превью")
        .optional(),
})

export type LineupFormData = z.infer<typeof lineupSchema>

export type AddLineupModel = {
    title: string
    description: string
    map: string
    link_to_video: string
    preview_image_link: string | null
}
