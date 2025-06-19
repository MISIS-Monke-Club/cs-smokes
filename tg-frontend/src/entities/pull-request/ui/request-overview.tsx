import { useMutation, useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { CircleHelp } from "lucide-react"
import { useSelector } from "react-redux"
import { api as requestApi } from "../api"
import { PullRequest } from "../domain/client"
import { UserBadge } from "./user-badge"
import { Button } from "@shared/ui/button"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"
import { Badge } from "@shared/ui/badge"
import { ImageComponent } from "@shared/ui/image"
import { Tooltip, TooltipContent, TooltipTrigger } from "@shared/ui/tooltip"
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { selectUserId } from "@entities/session"

export function RequestOverview({ id }: Pick<PullRequest, "id">) {
    const userId = useSelector(selectUserId)
    const {
        data: request,
        isLoading,
        isError,
    } = useQuery(requestApi.getByIdOptions(id))
    const { mutateAsync, isPending } = useMutation(
        requestApi.closeRequestById()
    )

    function clickHandler() {
        mutateAsync(id)
            .then(() => {
                toast.success("Successfully closed your request")
            })
            .catch((err) => {
                toast.error("Cant close this request now")
                console.error(err)
            })
    }

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
            <div className='flex flex-col gap-2.5 w-full'>
                <h1>Request to add grenade</h1>
                <h4>
                    <span>Grenade </span>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                className='color text-[var(--color-accent)]'
                                to={`/grenades/${request.lineup.grenadeId}`}
                            >
                                #{request.lineup.grenadeId}
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                            Click to view more about grenade
                        </TooltipContent>
                    </Tooltip>
                </h4>
                <ImageComponent
                    className='w-full self-center rounded-[8px]'
                    skeletonClasses='self-center'
                    url={request.lineup.previewImageLink}
                    placeholderElement={<CircleHelp />}
                    alt={`${request.lineup.title} preview image`}
                />
            </div>
            <div className='flex flex-col gap-1.5 self-start'>
                <h4>Created by</h4>
                <UserBadge user={request.creator} />
            </div>
            {request.status === "CLOSED" && !request.approver && (
                <div className='flex flex-col gap-1.5 self-start'>
                    <h4>Closed by</h4>
                    <UserBadge user={request.creator} />
                </div>
            )}
            {request.approver && (
                <div className='flex flex-col gap-1.5 self-start'>
                    <h4>[ADMIN ACTION] {request.status} by</h4>
                    <UserBadge user={request.approver} />
                </div>
            )}
            {request.status === "OPEN" && request.creator.userId === userId ? (
                <Button
                    onClick={clickHandler}
                    className='w-full bg-rose-600! hover:bg-rose-700! active:bg-rose-700!'
                    disabled={isPending}
                    size='lg'
                >
                    Cancel request
                </Button>
            ) : request.status === "OPEN" &&
              request.creator.userId !== userId ? (
                <Badge className='w-full' color='accent'>
                    status: Open
                </Badge>
            ) : request.status === "APPROVED" ? (
                <Badge color='success'>status: Approved</Badge>
            ) : request.status === "CLOSED" ? (
                <Badge color='danger'>status: Canceled</Badge>
            ) : request.status === "REJECTED" ? (
                <Badge color='danger'>status: Rejected</Badge>
            ) : null}
        </>
    )
}
