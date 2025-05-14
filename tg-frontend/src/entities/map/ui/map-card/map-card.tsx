import { useNavigate } from "react-router-dom"
import { MapModel } from "../../model/domain"
import classes from "./map-card.module.scss"
import { CardComponent } from "@shared/ui/card/card"

export function MapCard({ map }: { map: MapModel }) {
    const navigate = useNavigate()

    function clickHandler() {
        navigate(`/maps/${map.mapId}`)
    }

    // return (
    //     <Card
    //         className={classes.mapCard}
    //         onClick={clickHandler}
    //         aria-label='map-card'
    //     >
    //         <CardHeader>{map.name}</CardHeader>
    //         <CardContent>
    //             <ImageComponent url={map.imageLink} />
    //         </CardContent>
    //         <CardFooter>{map.mapId}</CardFooter>
    //     </Card>
    // )
    return (
        <CardComponent
            className={classes.mapCard}
            heading={map.name}
            onClick={clickHandler}
            aria-label='map-card'
            imgUrl={map.imageLink || undefined}
            imgAlt='map preview image'
        />
    )
}
