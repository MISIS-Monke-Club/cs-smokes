import { describe, expect, it } from "vitest"

import { classInputFromForm, mapInputFromForm, propertyInputFromForm } from "./catalog"

describe("admin catalog helpers", () => {
    it("converts map form values to backend fields", () => {
        expect(mapInputFromForm({ image: undefined, isEsportsPool: true, link: " https://map.example ", name: " Mirage " })).toEqual({
            is_esports_pool: true,
            link: "https://map.example",
            name: "Mirage",
        })
    })

    it("converts class form price and optional description", () => {
        expect(classInputFromForm({ description: " ", name: " Smoke ", price: "300" })).toEqual({
            name: "Smoke",
            price: 300,
        })
    })

    it("converts property form optional value", () => {
        expect(propertyInputFromForm({ name: " tickrate ", value: " 128 " })).toEqual({
            name: "tickrate",
            value: "128",
        })
    })
})
