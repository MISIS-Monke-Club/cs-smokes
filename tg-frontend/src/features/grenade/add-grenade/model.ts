import { z } from "zod"

export const lineupSchema = z.object({
    title: z
        .string()
        .min(3, "Название должно содержать минимум 3 символа")
        .max(100, "Название слишком длинное"),
    description: z
        .string()
        .min(10, "Описание должно содержать минимум 10   символов")
        .max(1000, "Описание слишком длинное"),
    map_id: z
        .string()
        .transform(Number)
        .refine((val) => !isNaN(val), {
            message: "Выберите карту",
        }),
    grenade_class_id: z.string().refine((val) => !isNaN(Number(val)), {
        message: "Некорректный тип гранаты",
    }),
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
    grenade_class_id: string
    link_to_video: string
    preview_image_link: string | null
}

export const convertToApiLineup = (data: LineupFormData, userId: number) => ({
    title: data.title,
    description: data.description,
    map_id: data.map_id,
    grenade_class_id: data.grenade_class_id,
    link_to_video: data.link_to_video,
    preview_image_link: data.preview_image_link,
    user_id: userId,
})
