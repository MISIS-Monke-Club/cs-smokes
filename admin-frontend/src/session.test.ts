import { describe, expect, it } from "vitest"

import { canDeleteComment, canGrantRoles, canManageUsers, canModeratePullRequests, readSession, roleLabel, writeSession } from "./session"

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

    it("keeps moderation and comment delete permissions role-aware", () => {
        const editor = { user_id: 4, roles: ["editor" as const] }
        const base = { user_id: 3, roles: ["base_admin" as const] }
        const ownComment = { creator: { user_id: 4 } }
        const otherComment = { creator: { user_id: 7 } }

        expect(canModeratePullRequests(editor)).toBe(false)
        expect(canModeratePullRequests(base)).toBe(true)
        expect(canDeleteComment(editor, ownComment)).toBe(true)
        expect(canDeleteComment(editor, otherComment)).toBe(false)
        expect(canDeleteComment(base, otherComment)).toBe(true)
    })
})
