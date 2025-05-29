import { queryOptions } from "@tanstack/react-query"
import { PullRequest } from "./domain/client"
import { PullRequestParams } from "./domain/query-params"
import {
    fromRequestDTOtoRequestModel,
    pull_request_details_schema,
} from "./domain/server"
import { instance } from "@shared/api"
import { typedQuery } from "@shared/lib/precooked-methods"

export const api = {
    baseUrl: "pull_requests",
    baseKey: ["pull_request"],

    // React query
    getByIdOptions: (id: PullRequest["id"], params: PullRequestParams) =>
        queryOptions({
            queryKey: [...api.baseKey, { type: "byId" }],
            queryFn: () => api.getById({ params, pullRequestId: id }),
        }),

    // Api
    getById: ({
        params,
        pullRequestId,
    }: {
        params: unknown
        pullRequestId: PullRequest["id"]
    }) =>
        typedQuery({
            request: instance.get(`${api.baseUrl}/${pullRequestId}`, {
                params,
            }),
            dtoSchema: pull_request_details_schema,
            fromDTO: fromRequestDTOtoRequestModel,
        }),
}
