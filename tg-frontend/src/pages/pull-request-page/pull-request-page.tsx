import { useParams } from "react-router-dom"
import { RequestOverview } from "@entities/pull-request"
import { GoBack } from "@features/go-back"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"

export function PullRequestPage() {
    const { requestId } = useParams()

    if (!requestId) {
        return <PlaceholderBlock>Cannot find this page...</PlaceholderBlock>
    }

    return (
        <>
            <GoBack />
            <RequestOverview id={Number(requestId)} />
        </>
    )
}
