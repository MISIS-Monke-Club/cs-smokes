import { describe, expect, it } from "vitest"

import { canGrantRoles, canManageUsers, readSession, roleLabel, writeSession } from "./session"

function memoryStorage() {
    const data = new Map<string, string>()
    return {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => data.set(key, value),
        removeItem: (key: string) => data.delete(key),
    }
}

describe("admin session helpers", () => {
    it("stores token in injected session storage", () => {
        const storage = memoryStorage()
        writeSession({ token: "access.jwt" }, storage)

        expect(readSession(storage)).toEqual({ token: "access.jwt" })
    })

    it("derives role capabilities from server roles", () => {
        expect(canManageUsers({ user_id: 1, roles: ["base_admin"] })).toBe(true)
        expect(canGrantRoles({ user_id: 1, roles: ["base_admin"] })).toBe(false)
        expect(canGrantRoles({ user_id: 1, roles: ["superuser"] })).toBe(true)
        expect(canManageUsers({ user_id: 1, roles: ["editor"] })).toBe(false)
        expect(roleLabel("editor")).toBe("Editor")
    })
})
