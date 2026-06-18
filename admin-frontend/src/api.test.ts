import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
    createGrenadeClass,
    createLineup,
    createMap,
    createProperty,
    createPropertyRelation,
    deleteLineup,
    fetchGrenadeClasses,
    fetchLineups,
    fetchMaps,
    fetchProperties,
    fetchPropertyRelations,
    updateLineup,
    updateMap,
} from "./api"

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

describe("admin content catalog API", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("fetches maps with legacy filter query names", async () => {
        client.get.mockResolvedValueOnce({ data: [{ map_id: 2, name: "Mirage" }] })

        await fetchMaps("jwt", { isEsportsPool: true, ordering: "by_alphabet", query: "mirage" })

        expect(client.get).toHaveBeenCalledWith("/admin/maps", {
            headers: { Authorization: "Bearer jwt" },
            params: {
                is_esports_pool: "true",
                ordering: "by_alphabet",
                query: "mirage",
            },
        })
    })

    it("writes map media fields as multipart form data", async () => {
        client.post.mockResolvedValueOnce({ data: { map_id: 2, name: "Mirage" } })
        client.patch.mockResolvedValueOnce({ data: { map_id: 2, name: "Mirage active" } })

        await createMap("jwt", { is_esports_pool: true, link: "https://map.example", name: "Mirage" })
        await updateMap("jwt", 2, { is_esports_pool: false, name: "Mirage active" })

        const createdBody = client.post.mock.calls[0][1] as FormData
        const patchedBody = client.patch.mock.calls[0][1] as FormData
        expect(client.post.mock.calls[0][0]).toBe("/admin/maps")
        expect(createdBody.get("name")).toBe("Mirage")
        expect(createdBody.get("link")).toBe("https://map.example")
        expect(createdBody.get("is_esports_pool")).toBe("true")
        expect(client.patch.mock.calls[0][0]).toBe("/admin/maps/2")
        expect(patchedBody.get("name")).toBe("Mirage active")
        expect(patchedBody.get("is_esports_pool")).toBe("false")
    })

    it("uses JSON endpoints for classes, properties, and lineup property links", async () => {
        client.get.mockResolvedValue({ data: [] })
        client.post.mockResolvedValue({ data: {} })

        await fetchGrenadeClasses("jwt")
        await createGrenadeClass("jwt", { description: "Smoke grenade", name: "Smoke", price: 300 })
        await fetchProperties("jwt")
        await createProperty("jwt", { name: "tickrate", value: "128" })
        await fetchPropertyRelations("jwt", 12)
        await createPropertyRelation("jwt", 12, 4)

        expect(client.get).toHaveBeenCalledWith("/admin/grenade-classes", { headers: { Authorization: "Bearer jwt" } })
        expect(client.post).toHaveBeenCalledWith(
            "/admin/grenade-classes",
            { description: "Smoke grenade", name: "Smoke", price: 300 },
            { headers: { Authorization: "Bearer jwt" } },
        )
        expect(client.get).toHaveBeenCalledWith("/admin/properties", { headers: { Authorization: "Bearer jwt" } })
        expect(client.post).toHaveBeenCalledWith(
            "/admin/properties",
            { name: "tickrate", value: "128" },
            { headers: { Authorization: "Bearer jwt" } },
        )
        expect(client.get).toHaveBeenCalledWith("/admin/property-list", {
            headers: { Authorization: "Bearer jwt" },
            params: { grenade_id: "12" },
        })
        expect(client.post).toHaveBeenCalledWith(
            "/admin/lineups/12/properties",
            { property_id: 4 },
            { headers: { Authorization: "Bearer jwt" } },
        )
    })
})
