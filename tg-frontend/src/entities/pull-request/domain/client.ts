// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { GrenadeModel } from "@entities/grenade"

// App models
export type PullRequest = {
    id: number
    lineupId: number
    creatorId: number
    approverId?: number | null
    status: "open" | "closed" | "pending" | "rejected" // based on Enum: [4]
    createdAt: string
    closedAt?: string | null
    creator: Creator
    approver?: Approver | null
    lineup: GrenadeModel
}

export type Creator = RequestUser
export type Approver = RequestUser & {
    adminType?: AdminType | null
}
export type RequestUser = {
    userId: number
    username: string
    firstName?: string | null
    lastName?: string | null
    avatarUrl?: string | null
}

export type AdminType = {
    adminTypeId: number
    isSuperuser: boolean
    isBaseAdmin: boolean
    isEditor: boolean
}
