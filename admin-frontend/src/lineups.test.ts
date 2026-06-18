import { describe, expect, it } from "vitest"

import { canManageContent, lineupFormFromLineup, lineupInputFromForm } from "./lineups"

describe("admin lineup helpers", () => {
    it("allows any server-confirmed admin role to manage content", () => {
        expect(canManageContent({ user_id: 1, roles: ["editor"] })).toBe(true)
        expect(canManageContent({ user_id: 1, roles: ["base_admin"] })).toBe(true)
        expect(canManageContent({ user_id: 1, roles: ["superuser"] })).toBe(true)
        expect(canManageContent(null)).toBe(false)
        expect(canManageContent({ user_id: 1, roles: [] })).toBe(false)
    })

    it("pre-fills edit forms from lineup derived fields", () => {
        const form = lineupFormFromLineup({
            created_at: "2026-06-18T10:00:00Z",
            creator: { user_id: 6, username: "author" },
            description: "CT smoke",
            grenade_class: { description: null, grenade_class_id: 3, name: "Smoke", price: 300 },
            grenade_id: 12,
            is_approved: true,
            is_favorite: false,
            link_to_video: "https://video.example/12",
            map_id: 2,
            preview_image_link: null,
            property_list: [{ name: "tickrate", property_id: 4, value: "128" }],
            request: { request_id: 8, status: "OPEN" },
            title: "Mirage window",
            user_id: 6,
            views: 44,
        })

        expect(form).toEqual({
            description: "CT smoke",
            grenadeClassID: "3",
            isApproved: true,
            linkToVideo: "https://video.example/12",
            mapID: "2",
            title: "Mirage window",
            userID: "6",
            views: "44",
        })
    })

    it("converts form strings to backend lineup input", () => {
        expect(
            lineupInputFromForm({
                description: "  ",
                grenadeClassID: "3",
                isApproved: false,
                linkToVideo: " https://video.example/2 ",
                mapID: "2",
                title: " A smoke ",
                userID: "6",
                views: "0",
            }),
        ).toEqual({
            grenade_class_id: 3,
            is_approved: false,
            link_to_video: "https://video.example/2",
            map_id: 2,
            title: "A smoke",
            user_id: 6,
            views: 0,
        })
    })
})
