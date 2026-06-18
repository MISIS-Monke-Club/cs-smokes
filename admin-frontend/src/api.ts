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

export type PullRequestDetail = {
    pull_request: PullRequestSummary
    comments: AdminComment[]
}

const api = axios.create({
    baseURL: __ADMIN_API_URL__.replace(/\/$/, ""),
    headers: {
        "Content-Type": "application/json",
    },
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

export type APIError = AxiosError
