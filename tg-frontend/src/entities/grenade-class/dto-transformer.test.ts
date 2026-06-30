import { describe, expect, it } from "vitest"

import { fromGrenadeClassDTO } from "./dto-transformer"
import { grenadeClassDTOschema } from "./model/domain"

describe("fromGrenadeClassDTO", () => {
    it("accepts nullable backend descriptions", () => {
        const dto = grenadeClassDTOschema.parse({
            description: null,
            grenade_class_id: 1,
            name: "Smoke",
            price: 300,
        })

        expect(fromGrenadeClassDTO(dto)).toEqual({
            description: null,
            id: 1,
            name: "Smoke",
            price: 300,
        })
    })
})
