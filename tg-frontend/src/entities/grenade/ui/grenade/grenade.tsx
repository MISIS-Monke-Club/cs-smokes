import { useNavigate } from "react-router-dom"
import React, { ReactNode } from "react"
import { GrenadeModel } from "../../model/domain"
import classes from "./grenade.module.scss"
import { CardComponent } from "@shared/ui/card"
import { Badge } from "@shared/ui/badge"

type GrenadeProps = React.ComponentProps<"div"> & {
    grenade: GrenadeModel
    bottomSlot?: ReactNode
    className?: string
    isLoading?: boolean
    isError?: boolean
}

export function Grenade({ grenade, ...rest }: GrenadeProps) {
    const navigate = useNavigate()

    function clickHandler() {
        navigate(`/grenades/${grenade.grenadeId}`)
    }

    return (
        <CardComponent
            className={classes.grenadeCard}
            heading={grenade.title}
            subheading={grenade.grenadeClass.name}
            onClick={clickHandler}
            topSlot={
                grenade.isApproved ? (
                    <Badge color='success'>approved</Badge>
                ) : (
                    <Badge color='danger'>danger</Badge>
                )
            }
            {...rest}
        />
    )
}
