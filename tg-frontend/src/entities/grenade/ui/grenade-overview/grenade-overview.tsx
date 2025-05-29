import { ReactNode } from "react"
import { GrenadeModel } from "../../model/domain"
import classes from "./grenade-overview.module.scss"
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
        <>
            <div className='flex flex-col items-start gap-2.5 w-full'>
                <h1>{grenade.title}</h1>
                <h2 className='text-muted-foreground'>{grenade.grenadeId}</h2>
            </div>
            <img
                className={classes.image}
                src={grenade.previewImageLink || ""}
                alt='grenade image'
                width='310'
                height='300'
                loading='lazy'
            />
            {actions}
        </>
    )
}
