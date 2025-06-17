import { ReactNode } from "react"
import { Frown } from "lucide-react"
import { GrenadeModel } from "../../model/domain"
import classes from "./grenade-overview.module.scss"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"
import { Badge } from "@shared/ui/badge"
import { ImageComponent } from "@shared/ui/image"

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
                <div className='flex flex-row justify-between items w-full'>
                    {grenade.isApproved ? (
                        <>
                            <h1>{grenade.title}</h1>
                            <Badge color='success'>Approved</Badge>
                        </>
                    ) : (
                        <>
                            <h1>{grenade.title}</h1>
                            <Badge color='danger'>Not approved yet</Badge>
                        </>
                    )}
                </div>
                <div className='flex flex-row w-full justify-between'>
                    <h2 className='text-muted-foreground'>
                        lineup id: {grenade.grenadeId}
                    </h2>
                    <h2 className='text-muted-foreground'>
                        {grenade.grenadeClass.name}
                    </h2>
                </div>
            </div>

            <div className='grid grid-cols-2 w-full'>
                <div className='flex flex-col gap-1 w-full'>
                    <h3>Author:</h3>
                    <div className='flex flex-row gap-1 w-full items-center'>
                        <ImageComponent
                            className='rounded-full'
                            url={grenade.creator.avatarUrl}
                            alt={`${grenade.creator.username} avatar`}
                            width={36}
                            height={36}
                        />
                        <p>{grenade.creator.username}</p>
                    </div>
                </div>
                <div className='flex flex-col gap-1 w-full'>
                    <h3>Map:</h3>
                    <div className='flex flex-row gap-1 w-full items-center'>
                        <ImageComponent
                            className='rounded-full'
                            skeletonClasses='rounded-full'
                            url={grenade.creator.avatarUrl}
                            alt={`${grenade.creator.username} avatar`}
                            width={36}
                            height={36}
                        />
                        <p>{grenade.mapId}</p>
                    </div>
                </div>
            </div>
            <ImageComponent
                className={classes.image}
                url={grenade.previewImageLink}
                alt='grenade image'
                skeletonClasses='w-full h-[300px] rounded-[8px] bg-[var(--color-background-alt)] flex flex-col justify-center items-center gap-1'
                placeholderElement={
                    <>
                        <span>Without image</span>
                        <Frown />
                    </>
                }
            />
            <div className='flex flex-col gap-1 w-full'>
                <h3>Description:</h3>
                <p className='text-left'>{grenade.description}</p>
            </div>
            <div className='flex flex-col gap-1 w-ful w-full'>
                <h3>Grenade information:</h3>
                <div>
                    <div className='flex flex-row justify-between items-center w-full'>
                        <h6 className='text-muted-foreground'>
                            Type of grenade
                        </h6>
                        <p>{grenade.grenadeClass.name}</p>
                    </div>
                    <div className='flex flex-row justify-between items-center w-full'>
                        <h6 className='text-muted-foreground'>
                            Grenade description
                        </h6>
                        <p>{grenade.grenadeClass.description}</p>
                    </div>
                </div>
            </div>
            {actions}
        </>
    )
}
