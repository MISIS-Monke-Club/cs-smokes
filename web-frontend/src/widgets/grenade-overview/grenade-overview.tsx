import classes from "./grenade-overview.module.scss"
import { grenadeApi } from "@entities/grenade"
import { Button } from "@shared/ui/button"
import { Loader2, Plus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

type GrenadeOverviewProps = {
    grenadeId: number
}

export function GrenadeOverview({ grenadeId }: GrenadeOverviewProps) {
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const { data: grenade } = useQuery(grenadeApi.getGrenadeById({ grenadeId }))

    function clickHandler() {
        setIsLoading(true)
        setTimeout(() => setIsLoading(false), 3000)
    }

    // TODO: add pending skeleton
    // if (isLoading) {
    //     return (
    //         <div>
    //             <Skeleton className='h-6 w-3.5' />
    //         </div>
    //     )
    // }

    return (
        <div className={classes.grenade}>
            <h2 className={classes.title}>
                Граната с ID: <span>{grenade?.grenade_id}</span>
            </h2>
            <div className={classes.content}>
                <div className={classes.textInfo}>
                    <div className={classes.user}>
                        <span>Создана пользователем: </span>
                        <span>{grenade?.user_id}</span>
                    </div>
                    <div className={classes.type}>
                        <span>Тип гранаты: </span>
                        <span>{grenade?.type_id}</span>
                    </div>
                    <div className={classes.video}>
                        <span>Ссылка на видео: </span>
                        <Button variant='link'>click me</Button>
                    </div>
                    {isLoading ? (
                        <Button disabled>
                            Добавить в избранное{" "}
                            <Loader2 className='animate-spin' />
                        </Button>
                    ) : (
                        <Button onClick={clickHandler}>
                            Добавить в избранное <Plus />
                        </Button>
                    )}
                </div>
                <img
                    className={classes.image}
                    src='/grenade-image.jpg'
                    alt='grenade image'
                    width='300'
                    height='300'
                    loading='lazy'
                />
            </div>
        </div>
    )
}
