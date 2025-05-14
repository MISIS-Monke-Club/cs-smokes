import { useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import classes from "./my-grenades-page.module.scss"
import { grenadeApi } from "@entities/grenade"
import { selectUserId } from "@entities/session"
import { GoBack } from "@features/go-back"

export const MyGrenadesList = () => {
    const userId = useSelector(selectUserId)
    const { data: grenades } = useQuery({
        ...grenadeApi.getMyGrenadesOptions(String(userId)),
        enabled: Boolean(userId),
    })

    return (
        <div className={classes.container}>
            <GoBack />
            <h1 className={classes.title}>Your lineups</h1>

            <div className={classes.list}>
                {grenades?.map((grenade) => (
                    <div key={grenade.grenadeId} className={classes.card}>
                        <div className={classes.info}>
                            <h3 className={classes.name}>{grenade.title}</h3>
                            <p className={classes.date}>
                                created {grenade.createdAt}
                            </p>
                        </div>
                        <div
                            className={`${classes.status} ${
                                grenade.isApproved
                                    ? classes.approved
                                    : classes.request
                            }`}
                        >
                            {grenade.isApproved ? "approved" : "request review"}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
