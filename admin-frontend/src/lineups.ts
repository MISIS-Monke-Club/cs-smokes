import type { AdminLineup, LineupInput } from "./api"
import type { AdminMe } from "./session"

export type LineupFormState = {
    description: string
    grenadeClassID: string
    isApproved: boolean
    linkToVideo: string
    mapID: string
    title: string
    userID: string
    views: string
}

export const emptyLineupForm: LineupFormState = {
    description: "",
    grenadeClassID: "",
    isApproved: false,
    linkToVideo: "",
    mapID: "",
    title: "",
    userID: "",
    views: "0",
}

export function canManageContent(me: AdminMe | null): boolean {
    return Boolean(me?.roles.length)
}

export function lineupFormFromLineup(lineup: AdminLineup): LineupFormState {
    return {
        description: lineup.description ?? "",
        grenadeClassID: String(lineup.grenade_class.grenade_class_id),
        isApproved: lineup.is_approved,
        linkToVideo: lineup.link_to_video ?? "",
        mapID: String(lineup.map_id),
        title: lineup.title,
        userID: String(lineup.user_id),
        views: String(lineup.views),
    }
}

export function lineupInputFromForm(form: LineupFormState): LineupInput {
    return {
        description: optionalText(form.description),
        grenade_class_id: optionalNumber(form.grenadeClassID),
        is_approved: form.isApproved,
        link_to_video: optionalText(form.linkToVideo),
        map_id: optionalNumber(form.mapID),
        title: optionalText(form.title),
        user_id: optionalNumber(form.userID),
        views: optionalNumber(form.views),
    }
}

function optionalNumber(value: string): number | undefined {
    const trimmed = value.trim()
    if (!trimmed) {
        return undefined
    }
    return Number(trimmed)
}

function optionalText(value: string): string | undefined {
    const trimmed = value.trim()
    return trimmed || undefined
}
