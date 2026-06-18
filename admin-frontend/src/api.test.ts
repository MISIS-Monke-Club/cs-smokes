import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createLineup, deleteLineup, fetchLineups, updateLineup } from "./api"

const client = vi.hoisted(() => ({
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
}))

vi.mock("axios", () => ({
    default: {
        create: vi.fn(() => client),
        isAxiosError: vi.fn(() => false),
    },
}))

describe("admin lineup API", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("fetches lineups with legacy filter query names", async () => {
        client.get.mockResolvedValueOnce({ data: [{ grenade_id: 9, title: "Window smoke" }] })

        const lineups = await fetchLineups("jwt", {
            isApproved: false,
            ordering: "-date_of_creation",
            query: "mirage",
        })

        expect(lineups).toEqual([{ grenade_id: 9, title: "Window smoke" }])
        expect(client.get).toHaveBeenCalledWith("/admin/lineups", {
            headers: { Authorization: "Bearer jwt" },
            params: {
                is_approved: "false",
                ordering: "-date_of_creation",
                query: "mirage",
            },
        })
    })

    it("writes lineups as multipart form data with backend field names", async () => {
        client.post.mockResolvedValueOnce({ data: { grenade_id: 10, title: "A smoke" } })
        client.patch.mockResolvedValueOnce({ data: { grenade_id: 10, title: "B smoke" } })
        client.delete.mockResolvedValueOnce({})

        await createLineup("jwt", {
            description: "landing spot",
            grenade_class_id: 3,
            is_approved: true,
            link_to_video: "https://video.example/1",
            map_id: 1,
            title: "A smoke",
            user_id: 2,
            views: 7,
        })
        await updateLineup("jwt", 10, { title: "B smoke", is_approved: false })
        await deleteLineup("jwt", 10)

        const createdBody = client.post.mock.calls[0][1] as FormData
        const patchedBody = client.patch.mock.calls[0][1] as FormData
        expect(client.post.mock.calls[0][0]).toBe("/admin/lineups")
        expect(createdBody.get("map_id")).toBe("1")
        expect(createdBody.get("user_id")).toBe("2")
        expect(createdBody.get("grenade_class_id")).toBe("3")
        expect(createdBody.get("title")).toBe("A smoke")
        expect(createdBody.get("description")).toBe("landing spot")
        expect(createdBody.get("link_to_video")).toBe("https://video.example/1")
        expect(createdBody.get("is_approved")).toBe("true")
        expect(createdBody.get("views")).toBe("7")
        expect(client.patch.mock.calls[0][0]).toBe("/admin/lineups/10")
        expect(patchedBody.get("title")).toBe("B smoke")
        expect(patchedBody.get("is_approved")).toBe("false")
        expect(client.delete).toHaveBeenCalledWith("/admin/lineups/10", {
            headers: { Authorization: "Bearer jwt" },
        })
    })
})
