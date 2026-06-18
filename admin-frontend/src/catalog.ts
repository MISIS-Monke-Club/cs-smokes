import type { GrenadeClassInput, MapInput, PropertyInput } from "./api"

export type MapFormState = {
    image?: File
    isEsportsPool: boolean
    link: string
    name: string
}

export type ClassFormState = {
    description: string
    name: string
    price: string
}

export type PropertyFormState = {
    name: string
    value: string
}

export const emptyMapForm: MapFormState = {
    image: undefined,
    isEsportsPool: false,
    link: "",
    name: "",
}

export const emptyClassForm: ClassFormState = {
    description: "",
    name: "",
    price: "0",
}

export const emptyPropertyForm: PropertyFormState = {
    name: "",
    value: "",
}

export function mapInputFromForm(form: MapFormState): MapInput {
    return {
        image_link: form.image,
        is_esports_pool: form.isEsportsPool,
        link: optionalText(form.link),
        name: optionalText(form.name),
    }
}

export function classInputFromForm(form: ClassFormState): GrenadeClassInput {
    return {
        description: optionalText(form.description),
        name: optionalText(form.name),
        price: optionalNumber(form.price),
    }
}

export function propertyInputFromForm(form: PropertyFormState): PropertyInput {
    return {
        name: optionalText(form.name),
        value: optionalText(form.value),
    }
}

function optionalNumber(value: string): number | undefined {
    const trimmed = value.trim()
    return trimmed ? Number(trimmed) : undefined
}

function optionalText(value: string): string | undefined {
    const trimmed = value.trim()
    return trimmed || undefined
}
