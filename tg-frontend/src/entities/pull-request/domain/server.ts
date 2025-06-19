import { z } from "zod"
import { MessageModel, PullRequest } from "./client"

// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { grenadeDTOschema, GrenadeModel } from "@entities/grenade"

// Api schemas
const admin_type_schema = z.object({
    admin_type_id: z.number(),
    is_superuser: z.boolean(),
    is_base_admin: z.boolean(),
    is_editor: z.boolean(),
})

const pull_request_creator_schema = z.object({
    id: z.number(),
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
    status: z.enum([
        "OPEN",
        "APPROVED",
        "REJECTED",
        "MERGED",
        "CLOSED",
        "WAITING FOR CREATION",
    ]),
    creator: pull_request_creator_schema,
    approver: pull_request_approver_schema.nullable(),
    lineup: grenadeDTOschema.omit({
        request: true,
    }),
    created_at: z.string().datetime(),
    closed_at: z.string().datetime().nullable(),
})

export const message_schema = z.object({
    id: z.number(),
    text: z.string(),
    created_at: z.string().datetime(),
    creator: z.object({
        user_id: z.number(),
        username: z.string(),
        first_name: z.string().nullable(),
        last_name: z.string().nullable(),
        avatar_url: z.string().nullable(),
        role: z.string(),
    }),
})

export const fromRequestDTOtoRequestModel = (
    request: z.infer<typeof pull_request_details_schema>
): PullRequest => ({
    id: request.id,
    status: request.status,
    createdAt: request.created_at,
    closedAt: request.closed_at,
    creator: {
        userId: request.creator.id,
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
    lineup: fromRequestLineupDto(request.lineup),
})

export const fromRequestLineupDto = (
    dto: z.infer<typeof pull_request_details_schema.shape.lineup>
): Omit<GrenadeModel, "request"> => {
    // Transforming dto -> model
    return {
        grenadeId: dto.grenade_id,
        mapId: dto.map_id,
        grenadeClass: {
            grenadeClassId: dto.grenade_class.grenade_class_id,
            name: dto.grenade_class.name,
            description: dto.grenade_class.description,
            price: dto.grenade_class.price,
        },
        propertyList: dto.property_list.map((el) => ({
            propertyId: el.property_id,
            name: el.name,
            value: el.value,
        })),
        linkToVideo: dto.link_to_video,
        creator: {
            userId: dto.creator.user_id,
            username: dto.creator.username,
            avatarUrl: dto.creator.avatar_url,
            firstName: dto.creator.first_name,
            lastName: dto.creator.last_name,
        },
        createdAt: dto.created_at,
        title: dto.title,
        description: dto.description,
        isApproved: dto.is_approved,
        isFavorite: dto.is_favorite,
        views: dto.views,
        previewImageLink: dto.preview_image_link,
    }
}

export const fromMessageDTOtoMessageModel = (
    message: z.infer<typeof message_schema>
): MessageModel => ({
    id: message.id,
    text: message.text,
    createdAt: message.created_at,
    creator: {
        userId: message.creator.user_id,
        username: message.creator.username,
        firstName: message.creator.first_name,
        lastName: message.creator.last_name,
        avatarUrl: message.creator.avatar_url,
        role: message.creator.role,
    },
})

export const fromMessagesDTOtoMessageModel = (
    messages: z.infer<ReturnType<typeof message_schema.array>>
): MessageModel[] => messages.map(fromMessageDTOtoMessageModel)
