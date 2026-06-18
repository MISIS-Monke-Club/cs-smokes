export type AdminRole = "superuser" | "base_admin" | "editor"

export type AdminSession = {
    token: string
}

export type AdminMe = {
    user_id: number
    roles: AdminRole[]
}

const storageKey = "cs-smokes-admin-session"

export function readSession(storage: Pick<Storage, "getItem"> = window.sessionStorage): AdminSession | null {
    const raw = storage.getItem(storageKey)
    if (!raw) {
        return null
    }
    try {
        const parsed = JSON.parse(raw) as Partial<AdminSession>
        if (typeof parsed.token === "string" && parsed.token.length > 0) {
            return { token: parsed.token }
        }
    } catch {
        return null
    }
    return null
}

export function writeSession(session: AdminSession, storage: Pick<Storage, "setItem"> = window.sessionStorage): void {
    storage.setItem(storageKey, JSON.stringify(session))
}

export function clearSession(storage: Pick<Storage, "removeItem"> = window.sessionStorage): void {
    storage.removeItem(storageKey)
}

export function canManageUsers(me: AdminMe | null): boolean {
    return Boolean(me?.roles.includes("superuser") || me?.roles.includes("base_admin"))
}

export function canGrantRoles(me: AdminMe | null): boolean {
    return Boolean(me?.roles.includes("superuser"))
}

export function roleLabel(role: AdminRole): string {
    switch (role) {
        case "superuser":
            return "Superuser"
        case "base_admin":
            return "Base admin"
        case "editor":
            return "Editor"
    }
}
