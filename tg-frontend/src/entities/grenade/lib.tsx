import { ReactNode } from "react"
import { GrenadeModel } from "./domain"
import { Grenade } from "./ui/grenade"

export const maper = (elements: GrenadeModel[]): ReactNode => {
    return (
        <>
            {elements.map((el, index) => (
                <Grenade key={crypto.randomUUID() + " " + index} grenade={el} />
            ))}
        </>
    )
}
