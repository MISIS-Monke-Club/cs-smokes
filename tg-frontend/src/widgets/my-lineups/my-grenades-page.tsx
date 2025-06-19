import { useMutation, useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useCallback } from "react"
import { toast } from "sonner"
import classes from "./my-grenades-page.module.scss"
import { grenadeApi, GrenadeModel } from "@entities/grenade"
import { selectUserId } from "@entities/session"
import { Button } from "@shared/ui/button"
import { Badge } from "@shared/ui/badge"
import { pullRequestApi } from "@entities/pull-request"

export const MyGrenadesList = () => {
    const userId = useSelector(selectUserId)
    const { data: grenades } = useQuery({
        ...grenadeApi.getMyGrenadesOptions(String(userId)),
        enabled: Boolean(userId),
    })
    const { mutateAsync, isPending } = useMutation(
        pullRequestApi.createRequest()
    )
    const navigate = useNavigate()

    const clickHandler = useCallback(
        (grenade: GrenadeModel) => {
            if (
                grenade.request.status !== "WAITING FOR CREATION" &&
                grenade.request.request_id !== null
            ) {
                navigate(`/requests/${grenade.request.request_id}`)
            } else {
                toast.error("Cant redirect you on page of this request")
            }
        },
        [navigate]
    )
    const createHandler = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>, grenade: GrenadeModel) => {
            e.stopPropagation()

            mutateAsync(grenade.grenadeId).catch((err) => {
                console.error(err)
                toast.error("cant create request now")
            })
        },
        [mutateAsync]
    )

    return (
        <div className={classes.container}>
            <h1 className={classes.title}>Your lineups</h1>

            <div className={classes.list}>
                {grenades?.map((grenade) => (
                    <div
                        key={grenade.grenadeId}
                        className={classes.card}
                        onClick={() => clickHandler(grenade)}
                    >
                        <div className={classes.info}>
                            <h3 className={classes.name}>{grenade.title}</h3>
                            <p className={classes.date}>
                                Created{" "}
                                {new Date(grenade.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    }
                                )}
                            </p>
                        </div>
                        {grenade.request.status === "WAITING FOR CREATION" ? (
                            <Button
                                className={classes.status_request}
                                onClick={(e) => createHandler(e, grenade)}
                                disabled={isPending}
                            >
                                Create request
                            </Button>
                        ) : grenade.request.status === "OPEN" ? (
                            <Badge color='disabled'>Opened request</Badge>
                        ) : grenade.request.status === "APPROVED" ? (
                            <Badge color='success'>Approved by admins</Badge>
                        ) : grenade.request.status === "CLOSED" ? (
                            <Badge color='danger'>Closed by you</Badge>
                        ) : grenade.request.status === "REJECTED" ? (
                            <Badge color='danger'>Rejected by admins</Badge>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    )
}
