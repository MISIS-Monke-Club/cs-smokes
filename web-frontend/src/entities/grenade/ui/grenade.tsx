import { useNavigate } from "react-router-dom"
import { GrenadeModel } from "../domain"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@shared/ui/card"
import { useMemo } from "react"

type GrenadeProps = {
    grenade: GrenadeModel
}

export function Grenade({ grenade }: GrenadeProps) {
    const navigate = useNavigate()

    function clickHandler() {
        navigate(`/grenades/${grenade.grenade_id}`)
    }

    const date = useMemo(() => {
        const dateInterface = new Date(grenade.created_at)

        const day = dateInterface.getDate()
        const month = dateInterface.getMonth() + 1

        return day + "." + month
    }, [grenade])

    return (
        <Card onClick={clickHandler}>
            <CardHeader>
                <CardTitle>
                    <span>Grenade id:</span>
                    <span>{grenade.grenade_id}</span>
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
