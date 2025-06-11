import { z } from "zod"
import { MessageModel, PullRequest } from "./client"
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { fromGrenadeDTO, grenadeDTOschema } from "@entities/grenade"

// Api schemas
const admin_type_schema = z.object({
    admin_type_id: z.number(),
    is_superuser: z.boolean(),
    is_base_admin: z.boolean(),
    is_editor: z.boolean(),
})

const pull_request_creator_schema = z.object({
    user_id: z.number(),
    username: z.string(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    avatar_url: z.string().nullable(),
})

const pull_request_approver_schema = z.object({
    user_id: z.number(),
    username: z.string(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    avatar_url: z.string().nullable(),
    admin_type: admin_type_schema.nullable(),
})

export const pull_request_details_schema = z.object({
    id: z.number(),
    lineup_id: z.number(),
    creator_id: z.number(),
    approver_id: z.number().nullable(),
    status: z.enum(["open", "closed", "pending", "rejected"]),
    created_at: z.string().datetime(),
    closed_at: z.string().datetime().nullable(),
    creator: pull_request_creator_schema,
    approver: pull_request_approver_schema.nullable(),
    lineup: grenadeDTOschema,
})

export const message_schema = z.object({
    id: z.number(),
    pr_id: z.number(),
    user_id: z.number(),
    text: z.string(),
    parent_id: z.number().nullable(),
    created_at: z.string().datetime(),
    creator: z.object({
        user_id: z.number(),
        username: z.string(),
        first_name: z.string().nullable(),
        last_name: z.string().nullable(),
        avatar_url: z.string().nullable(),
    }),
})

const mapStatus = (
    status: "open" | "closed" | "pending" | "rejected"
): PullRequest["status"] => {
    switch (status) {
        case "open":
        case "pending":
            return "Open"
        case "closed":
            return "Closed"
        case "rejected":
            return "Closed"
    }
}

export const fromRequestDTOtoRequestModel = (
    request: z.infer<typeof pull_request_details_schema>
): PullRequest => ({
    id: request.id,
    lineupId: request.lineup_id,
    creatorId: request.creator_id,
    approverId: request.approver_id,
    status: mapStatus(request.status),
    createdAt: request.created_at,
    closedAt: request.closed_at,
    creator: {
        userId: request.creator.user_id,
        username: request.creator.username,
        firstName: request.creator.first_name,
        lastName: request.creator.last_name,
        avatarUrl: request.creator.avatar_url,
    },
    approver: request.approver
        ? {
              userId: request.approver.user_id,
              username: request.approver.username,
              firstName: request.approver.first_name,
              lastName: request.approver.last_name,
              avatarUrl: request.approver.avatar_url,
              adminType: request.approver.admin_type
                  ? {
                        adminTypeId: request.approver.admin_type.admin_type_id,
                        isSuperuser: request.approver.admin_type.is_superuser,
                        isBaseAdmin: request.approver.admin_type.is_base_admin,
                        isEditor: request.approver.admin_type.is_editor,
                    }
                  : null,
          }
        : null,
    lineup: fromGrenadeDTO(request.lineup),
})

export const fromMessageDTOtoMessageModel = (
    message: z.infer<typeof message_schema>
): MessageModel => ({
    id: message.id,
    prId: message.pr_id,
    userId: message.user_id,
    text: message.text,
    parentId: message.parent_id,
    createdAt: message.created_at,
    creator: {
        userId: message.creator.user_id,
        username: message.creator.username,
        firstName: message.creator.first_name,
        lastName: message.creator.last_name,
        avatarUrl: message.creator.avatar_url,
    },
})

export const fromMessagesDTOtoMessageModel = (
    messages: z.infer<ReturnType<typeof message_schema.array>>
): MessageModel[] => messages.map(fromMessageDTOtoMessageModel)
