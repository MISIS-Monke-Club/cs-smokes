import { ReactNode } from "react"
import { GrenadeModel } from "../domain"
import { Grenade } from "../ui/grenade/grenade"

export const grenadesMaper = (elements: GrenadeModel[]): ReactNode => (
    <>
        {elements.map((el) => (
            <Grenade key={el.grenadeId} grenade={el} />
        ))}
    </>
)
