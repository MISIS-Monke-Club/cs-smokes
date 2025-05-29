import { PullRequest } from "./client"

export type PullRequestParams = {
    creator_id?: string
    lineup_id?: string
    status?: PullRequest["status"]
}
