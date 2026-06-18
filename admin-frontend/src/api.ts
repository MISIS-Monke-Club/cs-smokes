import axios, { AxiosError } from "axios"

import type { AdminMe } from "./session"
import type { AdminRole } from "./session"

export type LoginResponse = {
    access_token: string
    refresh_token: string
    user: {
        user_id: number
        username: string
    }
}

export type PullRequestSummary = {
    id: number
    status: string
    created_at: string
    closed_at: string | null
    creator: {
        id: number
        username: string
    }
    lineup: {
        grenade_id: number
        title: string
        map_id: number
        is_approved: boolean
    }
}

export type AdminComment = {
    id: number
    text: string
    creator: {
        user_id: number
        username: string
        role: string
    }
    created_at: string
}

export type AdminUser = {
    user_id: number
    username: string
    email: string | null
    first_name: string | null
    last_name: string | null
    is_banned: boolean
    roles: AdminRole[]
}

export type AdminLineup = {
    user_id: number
    grenade_id: number
    map_id: number
    link_to_video: string | null
    creator: {
        user_id: number
        username: string
        role?: string
    }
    created_at: string
    title: string
    description: string | null
    is_approved: boolean
    is_favorite: boolean
    views: number
    preview_image_link: string | null
    grenade_class: {
        grenade_class_id: number
        name: string
        description: string | null
        price: number
    }
    property_list: Array<{
        property_id: number
        name: string
        value: string | null
    }>
    request: {
        request_id: number | null
        status: string
    }
}

export type LineupFilters = {
    isApproved?: boolean
    ordering?: "date_of_creation" | "-date_of_creation" | "by_alphabet" | "-by_alphabet"
    query?: string
}

export type LineupInput = {
    description?: string
    grenade_class_id?: number
    is_approved?: boolean
    link_to_video?: string
    map_id?: number
    preview_image_link?: File
    title?: string
    user_id?: number
    views?: number
}

export type AdminMap = {
    map_id: number
    name: string
    link: string | null
    is_esports_pool: boolean
    image_link: string | null
}

export type MapFilters = {
    isEsportsPool?: boolean
    ordering?: "quantity" | "-quantity" | "by_alphabet" | "-by_alphabet"
    query?: string
}

export type MapInput = {
    image_link?: File
    is_esports_pool?: boolean
    link?: string
    name?: string
}

export type AdminGrenadeClass = {
    grenade_class_id: number
    name: string
    description: string | null
    price: number
}

export type GrenadeClassInput = {
    description?: string
    name?: string
    price?: number
}

export type AdminProperty = {
    property_id: number
    name: string
    value: string | null
}

export type PropertyInput = {
    name?: string
    value?: string
}

export type AdminPropertyRelation = {
    property_id: number
    grenade_id: number
    name: string
    value: string | null
}

export type PullRequestDetail = {
    pull_request: PullRequestSummary
    comments: AdminComment[]
}

const api = axios.create({
    baseURL: __ADMIN_API_URL__.replace(/\/$/, ""),
})

export function isAuthFailure(error: unknown): boolean {
    if (!axios.isAxiosError(error)) {
        return false
    }
    return error.response?.status === 401 || error.response?.status === 403
}

export function errorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { error?: { message?: string }; detail?: string } | undefined
        return data?.error?.message || data?.detail || error.message
    }
    if (error instanceof Error) {
        return error.message
    }
    return "Request failed"
}

export async function login(username: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/login/", { username, password })
    return response.data
}

export async function fetchMe(token: string): Promise<AdminMe> {
    const response = await api.get<AdminMe>("/admin/me", authConfig(token))
    return response.data
}

export async function fetchPullRequests(token: string): Promise<PullRequestSummary[]> {
    const response = await api.get<PullRequestSummary[]>("/admin/pull_requests", authConfig(token))
    return response.data
}

export async function fetchUsers(token: string): Promise<AdminUser[]> {
    const response = await api.get<AdminUser[]>("/admin/users", authConfig(token))
    return response.data
}

export async function setUserRoles(token: string, userID: number, roles: AdminRole[]): Promise<void> {
    await api.put(`/admin/users/${userID}/roles`, { roles }, authConfig(token))
}

export async function fetchLineups(token: string, filters: LineupFilters = {}): Promise<AdminLineup[]> {
    const params: Record<string, string> = {}
    if (filters.isApproved !== undefined) {
        params.is_approved = String(filters.isApproved)
    }
    if (filters.ordering) {
        params.ordering = filters.ordering
    }
    if (filters.query) {
        params.query = filters.query
    }
    const response = await api.get<AdminLineup[]>("/admin/lineups", {
        ...authConfig(token),
        params,
    })
    return response.data
}

export async function createLineup(token: string, input: LineupInput): Promise<AdminLineup> {
    const response = await api.post<AdminLineup>("/admin/lineups", toLineupFormData(input), authConfig(token))
    return response.data
}

export async function updateLineup(token: string, id: number, input: LineupInput): Promise<AdminLineup> {
    const response = await api.patch<AdminLineup>(`/admin/lineups/${id}`, toLineupFormData(input), authConfig(token))
    return response.data
}

export async function deleteLineup(token: string, id: number): Promise<void> {
    await api.delete(`/admin/lineups/${id}`, authConfig(token))
}

export async function fetchMaps(token: string, filters: MapFilters = {}): Promise<AdminMap[]> {
    const params: Record<string, string> = {}
    if (filters.isEsportsPool !== undefined) {
        params.is_esports_pool = String(filters.isEsportsPool)
    }
    if (filters.ordering) {
        params.ordering = filters.ordering
    }
    if (filters.query) {
        params.query = filters.query
    }
    const response = await api.get<AdminMap[]>("/admin/maps", {
        ...authConfig(token),
        params,
    })
    return response.data
}

export async function createMap(token: string, input: MapInput): Promise<AdminMap> {
    const response = await api.post<AdminMap>("/admin/maps", toMapFormData(input), authConfig(token))
    return response.data
}

export async function updateMap(token: string, id: number, input: MapInput): Promise<AdminMap> {
    const response = await api.patch<AdminMap>(`/admin/maps/${id}`, toMapFormData(input), authConfig(token))
    return response.data
}

export async function deleteMap(token: string, id: number): Promise<void> {
    await api.delete(`/admin/maps/${id}`, authConfig(token))
}

export async function fetchGrenadeClasses(token: string): Promise<AdminGrenadeClass[]> {
    const response = await api.get<AdminGrenadeClass[]>("/admin/grenade-classes", authConfig(token))
    return response.data
}

export async function createGrenadeClass(token: string, input: GrenadeClassInput): Promise<AdminGrenadeClass> {
    const response = await api.post<AdminGrenadeClass>("/admin/grenade-classes", input, authConfig(token))
    return response.data
}

export async function updateGrenadeClass(token: string, id: number, input: GrenadeClassInput): Promise<AdminGrenadeClass> {
    const response = await api.patch<AdminGrenadeClass>(`/admin/grenade-classes/${id}`, input, authConfig(token))
    return response.data
}

export async function deleteGrenadeClass(token: string, id: number): Promise<void> {
    await api.delete(`/admin/grenade-classes/${id}`, authConfig(token))
}

export async function fetchProperties(token: string): Promise<AdminProperty[]> {
    const response = await api.get<AdminProperty[]>("/admin/properties", authConfig(token))
    return response.data
}

export async function createProperty(token: string, input: PropertyInput): Promise<AdminProperty> {
    const response = await api.post<AdminProperty>("/admin/properties", input, authConfig(token))
    return response.data
}

export async function updateProperty(token: string, id: number, input: PropertyInput): Promise<AdminProperty> {
    const response = await api.patch<AdminProperty>(`/admin/properties/${id}`, input, authConfig(token))
    return response.data
}

export async function deleteProperty(token: string, id: number): Promise<void> {
    await api.delete(`/admin/properties/${id}`, authConfig(token))
}

export async function fetchPropertyRelations(token: string, grenadeID?: number): Promise<AdminPropertyRelation[]> {
    const response = await api.get<AdminPropertyRelation[]>("/admin/property-list", {
        ...authConfig(token),
        params: grenadeID == null ? {} : { grenade_id: String(grenadeID) },
    })
    return response.data
}

export async function createPropertyRelation(token: string, grenadeID: number, propertyID: number): Promise<AdminPropertyRelation> {
    const response = await api.post<AdminPropertyRelation>(`/admin/lineups/${grenadeID}/properties`, { property_id: propertyID }, authConfig(token))
    return response.data
}

export async function deletePropertyRelation(token: string, grenadeID: number, propertyID: number): Promise<void> {
    await api.delete(`/admin/lineups/${grenadeID}/properties/${propertyID}`, authConfig(token))
}

export async function fetchPullRequestDetail(token: string, id: number): Promise<PullRequestDetail> {
    const response = await api.get<PullRequestDetail>(`/admin/pull_requests/${id}`, authConfig(token))
    return response.data
}

export async function approvePullRequest(token: string, id: number): Promise<void> {
    await api.patch(`/admin/pull_requests/${id}/approve`, undefined, authConfig(token))
}

export async function rejectPullRequest(token: string, id: number): Promise<void> {
    await api.patch(`/admin/pull_requests/${id}/reject`, undefined, authConfig(token))
}

export async function cancelPullRequest(token: string, id: number): Promise<void> {
    await api.patch(`/admin/pull_requests/${id}/cancel`, undefined, authConfig(token))
}

export async function createComment(token: string, pullRequestID: number, text: string): Promise<AdminComment> {
    const response = await api.post<AdminComment>(`/admin/pull_requests/${pullRequestID}/comments`, { text }, authConfig(token))
    return response.data
}

export async function deleteComment(token: string, id: number): Promise<void> {
    await api.delete(`/admin/comments/${id}`, authConfig(token))
}

function authConfig(token: string) {
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
}

function toLineupFormData(input: LineupInput): FormData {
    const body = new FormData()
    appendFormValue(body, "map_id", input.map_id)
    appendFormValue(body, "user_id", input.user_id)
    appendFormValue(body, "title", input.title)
    appendFormValue(body, "description", input.description)
    appendFormValue(body, "is_approved", input.is_approved)
    appendFormValue(body, "views", input.views)
    appendFormValue(body, "grenade_class_id", input.grenade_class_id)
    appendFormValue(body, "link_to_video", input.link_to_video)
    appendFormValue(body, "preview_image_link", input.preview_image_link)
    return body
}

function toMapFormData(input: MapInput): FormData {
    const body = new FormData()
    appendFormValue(body, "name", input.name)
    appendFormValue(body, "link", input.link)
    appendFormValue(body, "is_esports_pool", input.is_esports_pool)
    appendFormValue(body, "image_link", input.image_link)
    return body
}

function appendFormValue(body: FormData, key: string, value: boolean | File | number | string | undefined): void {
    if (value === undefined || value === "") {
        return
    }
    if (value instanceof File) {
        body.append(key, value)
        return
    }
    body.append(key, String(value))
}

export type APIError = AxiosError
