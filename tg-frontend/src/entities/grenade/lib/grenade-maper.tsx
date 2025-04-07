import { ReactNode } from "react"
import { GrenadeModel } from "../domain"
import { Grenade } from "../ui/grenade/grenade"

export const grenadeMaper = (elements: GrenadeModel[]): ReactNode => (
    <>
        {elements.map((el) => (
            <Grenade key={el.id} grenade={el} />
        ))}
    </>
)
