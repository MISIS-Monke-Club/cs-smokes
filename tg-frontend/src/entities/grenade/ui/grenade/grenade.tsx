import { useNavigate } from "react-router-dom"
import React, { useMemo } from "react"
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
import { dateFormatter } from "@shared/lib/date-formatter"

type GrenadeProps = React.ComponentProps<"div"> & {
    grenade: GrenadeModel
    className?: string
}

export function Grenade({ grenade, className = "", ...rest }: GrenadeProps) {
    const navigate = useNavigate()

    function clickHandler() {
        navigate(`/grenades/${grenade.grenadeId}`)
    }

    const date = useMemo(() => {
        return dateFormatter({
            isoDatetime: grenade.createdAt,
            day: true,
            month: true,
        })
    }, [grenade])

    const combinedClass: string = useMemo(() => {
        const draftClass = [classes.grenadeCard]

        if (className) {
            draftClass.push(className)
        }

        return draftClass.join(" ")
    }, [className])

    return (
        <Card className={combinedClass} onClick={clickHandler} {...rest}>
            <CardHeader>
                <CardTitle>Grenade id:{grenade.grenadeId}</CardTitle>
                <CardDescription>view cool grenade</CardDescription>
            </CardHeader>
            <CardContent>
                <img
                    src='/grenade-image.jpg'
                    alt='grenade image'
                    loading='lazy'
                />
            </CardContent>
            <CardFooter>Created at:{date}</CardFooter>
        </Card>
    )
}
