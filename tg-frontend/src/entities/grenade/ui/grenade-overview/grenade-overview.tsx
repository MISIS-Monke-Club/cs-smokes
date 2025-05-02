import { ReactNode } from "react"
import { GrenadeModel } from "../../model/domain"
import classes from "./grenade-overview.module.scss"
import { Button } from "@shared/ui/button"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"

type GrenadeOverviewProps = {
    grenade?: GrenadeModel
    isLoading?: boolean
    isError?: boolean
    actions?: ReactNode
}

export function GrenadeOverview({
    grenade,
    isError,
    isLoading,
    actions,
}: GrenadeOverviewProps) {
    if (isError) {
        return (
            <PlaceholderBlock data-testid='data-overview-error-placeholder'>
                Something went wrong with grenade overview...
            </PlaceholderBlock>
        )
    }

    if (isLoading) {
        return (
            <div aria-label='loader' data-testid='grenade-overview-loader'>
                Loading...
            </div>
        )
    }

    if (!grenade) {
        return (
            <PlaceholderBlock data-testid='data-overview-empty-grenade'>
                Data was not provided(
            </PlaceholderBlock>
        )
    }

    return (
        <div className={classes.grenade}>
            <h2 className={classes.title}>
                Граната с ID: <span>{grenade?.grenadeId}</span>
            </h2>
            <div className={classes.content}>
                <div className={classes.textInfo}>
                    <div className={classes.user}>
                        <span>Создана пользователем: </span>
                        <span data-testid='grenade-overview-author'>
                            {grenade?.userId}
                        </span>
                    </div>
                    <div className={classes.type}>
                        <span>Тип гранаты: </span>
                        <span data-testid='grenade-overview-grenade-type'>
                            {grenade?.typeId}
                        </span>
                    </div>
                    <div className={classes.video}>
                        <span>Ссылка на видео: </span>
                        <Button variant='link'>click me</Button>
                    </div>
                    <div className={classes.actions}>{actions}</div>
                </div>
                <img
                    className={classes.image}
                    src={grenade.previewImageLink || ""}
                    alt='grenade image'
                    width='300'
                    height='300'
                    loading='lazy'
                />
            </div>
        </div>
    )
}
