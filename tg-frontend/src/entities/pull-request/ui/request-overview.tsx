import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { api as requestApi } from "../api"
import { PullRequest } from "../domain/client"
import { UserBadge } from "./user-badge"
import { Button } from "@shared/ui/button"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"
import { Badge } from "@shared/ui/badge"

export function RequestOverview({ id }: Pick<PullRequest, "id">) {
    const {
        data: request,
        isLoading,
        isError,
    } = useQuery(requestApi.getByIdOptions(id))

    if (isLoading) {
        return <div>Loading...</div>
    }

    if (isError) {
        return <PlaceholderBlock>Something went wrong...</PlaceholderBlock>
    }

    if (!request) {
        return <PlaceholderBlock>Data was corrupted...</PlaceholderBlock>
    }

    return (
        <>
            <div className='flex flex-col gap-2.5'>
                <h1>Request to add grenade</h1>
                <h4>
                    grenade
                    <Button asChild variant='link'>
                        #<Link to={`/grenades/${request.lineupId}`}></Link>
                    </Button>
                </h4>
            </div>
            {request.approver && (
                <div className='flex flex-col gap-2.5'>
                    <h4>{request.status} by</h4>
                    <UserBadge user={request.approver} />
                </div>
            )}
            {request.status === "Open" ? (
                <Button className='w-[calc(100dvw - 10px)]'>Сlose request</Button>
            ) : request.status === "Approved" ? (
                <Badge color='success'>approved</Badge>
            ) : null}
        </>
    )
}
