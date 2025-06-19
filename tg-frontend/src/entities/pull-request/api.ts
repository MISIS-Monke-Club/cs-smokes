import { MutationOptions, queryOptions } from "@tanstack/react-query"
import { toast } from "sonner"
import { PullRequest } from "./domain/client"
import {
    fromMessagesDTOtoMessageModel,
    fromRequestDTOtoRequestModel,
    message_schema,
    pull_request_details_schema,
} from "./domain/server"
import { client, instance } from "@shared/api"
import { typedQuery } from "@shared/lib/precooked-methods"
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { grenadeApi, GrenadeModel } from "@entities/grenade"

export const api = {
    baseUrl: "pull_requests",
    baseKey: ["pull_request"],

    // React query
    getByIdOptions: (id: PullRequest["id"]) =>
        queryOptions({
            queryKey: [...api.baseKey, { type: "byId", id }],
            queryFn: () => api.getById({ pullRequestId: id }),
        }),
    getMessagesByRequestOptions: (id: PullRequest["id"]) =>
        queryOptions({
            queryKey: [...api.baseKey, { type: "byId", id }, "messages"],
            queryFn: () =>
                api.getMessagesByRequest({
                    pullRequestId: id,
                }),
        }),
    createRequest: (): MutationOptions<
        unknown,
        unknown,
        GrenadeModel["grenadeId"],
        GrenadeModel
    > => ({
        mutationFn: (id) =>
            api.create({
                grenadeId: id,
            }),
        onSettled: () => {
            client.invalidateQueries({
                queryKey: api.baseKey,
            })
            client.invalidateQueries({
                queryKey: grenadeApi.baseKey,
            })
        },
    }),
    closeRequestById: (): MutationOptions<
        unknown,
        unknown,
        GrenadeModel["grenadeId"]
    > => ({
        mutationFn: (id) => instance.patch(`/${api.baseUrl}/${id}/cancel`),
        onSettled: () => {
            client.invalidateQueries({ queryKey: api.baseKey })
        },
    }),

    // Api
    create: ({ grenadeId }: Pick<GrenadeModel, "grenadeId">) =>
        instance.post(api.baseUrl, {
            lineup_id: grenadeId,
        }),
    getById: ({ pullRequestId }: { pullRequestId: PullRequest["id"] }) =>
        typedQuery({
            request: instance.get(`${api.baseUrl}/${pullRequestId}/`),
            dtoSchema: pull_request_details_schema,
            fromDTO: fromRequestDTOtoRequestModel,
        }).catch((err) => {
            toast.error("Error in request by id request")
            console.error(err)

            throw err
        }),
    getMessagesByRequest: ({
        pullRequestId,
    }: {
        pullRequestId: PullRequest["id"]
    }) =>
        typedQuery({
            request: instance.get(`${api.baseUrl}/${pullRequestId}/comments`),
            dtoSchema: message_schema.array(),
            fromDTO: fromMessagesDTOtoMessageModel,
        }).catch((err) => {
            toast.error(`Cant get messages by request id #${pullRequestId}`)
            console.error(err)

            throw err
        }),
}
