import { ReactNode } from "react"
import { MapModel } from "../model"
import { MapCard } from "../ui/map-card/map-card"

export const mapsMaper = (maps: MapModel[]): ReactNode => {
    return (
        <>
            {maps.map((el, index) => (
                <MapCard key={crypto.randomUUID() + index} map={el} />
            ))}
        </>
    )
}
