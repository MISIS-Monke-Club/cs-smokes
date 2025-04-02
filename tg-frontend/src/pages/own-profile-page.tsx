import { useSelector } from "react-redux"
import { selectUserId } from "@entities/session"
import { ProfileOverview } from "@widgets/profile-overview/profile-overview"

export function OwnProfilePage() {
    const userId = useSelector(selectUserId)

    return (
        <>
            <h1>
                <b>YOUR</b> profile
            </h1>
            <ProfileOverview userId={userId} isEditable />
        </>
    )
}
