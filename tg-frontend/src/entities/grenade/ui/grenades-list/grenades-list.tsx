import { useSelector } from "react-redux"
import { GrenadeModel } from "../../model/domain"
import { selectGrenadeLists } from "../../model/slice"
import { ItemsList } from "@shared/ui/items-list"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"

type GrenadesListProps = {
    grenades?: GrenadeModel[]
    grenadesListId: string
    isError?: boolean
    isLoading?: boolean
}

// Component that ONLY displays provided data, all api requests moved to the features
export function GrenadesListComponent({
    grenades,
    grenadesListId,
    isError,
    isLoading,
}: GrenadesListProps) {
    // Makes possible to change map function across all the app
    const { mapFunction } = useSelector(selectGrenadeLists)[grenadesListId]

    if (isError) {
        return (
            <PlaceholderBlock>
                Something went wrong in grenades list...
            </PlaceholderBlock>
        )
    }

    return (
        <ItemsList
            elements={grenades}
            mapFunction={mapFunction}
            isLoading={isLoading}
            loadingItemsLength={15}
        />
    )
}
