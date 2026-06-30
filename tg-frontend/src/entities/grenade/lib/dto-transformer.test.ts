import { describe, expect, it } from "vitest"

import { grenadeDTOschema } from "../model/domain"
import { fromGrenadeDTO } from "./dto-transformer"

describe("fromGrenadeDTO", () => {
    it("accepts nullable backend description fields", () => {
        const dto = grenadeDTOschema.parse({
            created_at: "2026-01-01T00:00:00Z",
            creator: {
                avatar_url: null,
                first_name: null,
                last_name: null,
                user_id: 1,
                username: "player",
            },
            description: null,
            grenade_class: {
                description: null,
                grenade_class_id: 1,
                name: "Smoke",
                price: 300,
            },
            grenade_id: 10,
            is_approved: true,
            is_favorite: false,
            link_to_video: null,
            map_id: 2,
            preview_image_link: null,
            property_list: [
                {
                    name: "tickrate",
                    property_id: 3,
                    value: null,
                },
            ],
            request: {
                request_id: null,
                status: "WAITING FOR CREATION",
            },
            title: "Window smoke",
            views: 0,
        })

        const model = fromGrenadeDTO(dto)

        expect(model.grenadeClass.description).toBeNull()
        expect(model.propertyList[0]?.value).toBeNull()
    })
})
