import { useSelector } from "react-redux"
import { selectUserId } from "@entities/session"
import { ProfileOverview } from "@widgets/profile-overview/profile-overview"

export function OwnProfilePage() {
    const userId = useSelector(selectUserId)

    return (
        <>
            <ProfileOverview userId={userId} isEditable />
        </>
    )
}
