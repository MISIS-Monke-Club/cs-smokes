import { useNavigate } from "react-router-dom"
import { useMemo } from "react"
import { GrenadeModel } from "../../domain"
import classes from "./grenade.module.scss"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@shared/ui/card"

type GrenadeProps = {
    grenade: GrenadeModel
}

export function Grenade({ grenade }: GrenadeProps) {
    const navigate = useNavigate()

    function clickHandler() {
        navigate(`/grenades/${grenade.grenadeId}`)
    }

    const date = useMemo(() => {
        const dateInterface = new Date(grenade.createdAt)

        const day = dateInterface.getDate()
        const month = dateInterface.getMonth() + 1

        return day + "." + month
    }, [grenade])

    return (
        <Card className={classes.grenadeCard} onClick={clickHandler}>
            <CardHeader>
                <CardTitle>
                    <span>Grenade id:</span>
                    <span>{grenade.grenadeId}</span>
                </CardTitle>
                <CardDescription>view cool grenade</CardDescription>
            </CardHeader>
            <CardContent>
                <img
                    src='/grenade-image.jpg'
                    alt='grenade image'
                    loading='lazy'
                />
            </CardContent>
            <CardFooter>
                <span>Created at:</span>
                <span>{date}</span>
            </CardFooter>
        </Card>
    )
}
