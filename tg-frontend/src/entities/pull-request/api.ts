import { MutationOptions, queryOptions } from "@tanstack/react-query"
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

    // Api
    create: ({ grenadeId }: Pick<GrenadeModel, "grenadeId">) =>
        instance.post("/", {
            lineup_id: grenadeId,
        }),
    closeById: ({ pullRequestId }: { pullRequestId: PullRequest["id"] }) =>
        typedQuery({
            request: instance.get(`${api.baseUrl}/${pullRequestId}/`),
            dtoSchema: pull_request_details_schema,
            fromDTO: fromRequestDTOtoRequestModel,
        }),
    getById: ({ pullRequestId }: { pullRequestId: PullRequest["id"] }) =>
        typedQuery({
            request: instance.get(`${api.baseUrl}/${pullRequestId}/`),
            dtoSchema: pull_request_details_schema,
            fromDTO: fromRequestDTOtoRequestModel,
        }),
    getMessagesByRequest: ({
        pullRequestId,
    }: {
        pullRequestId: PullRequest["id"]
    }) =>
        typedQuery({
            request: instance.get(`${api.baseUrl}/${pullRequestId}/`),
            dtoSchema: message_schema.array(),
            fromDTO: fromMessagesDTOtoMessageModel,
        }),
}
