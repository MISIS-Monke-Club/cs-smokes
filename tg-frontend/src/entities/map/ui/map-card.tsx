import { useNavigate } from "react-router-dom"
import { MapModel } from "../model"
import { Card, CardContent, CardFooter, CardHeader } from "@shared/ui/card"
import { ImageComponent } from "@shared/ui/image"

export function MapCard({ map }: { map: MapModel }) {
    const navigate = useNavigate()

    function clickHandler() {
        navigate(`/maps/${map.mapId}`)
    }

    return (
        <Card onClick={clickHandler}>
            <CardHeader>{map.name}</CardHeader>
            <CardContent>
                <ImageComponent url={map.imageLink} />
            </CardContent>
            <CardFooter>{map.mapId}</CardFooter>
        </Card>
    )
}
