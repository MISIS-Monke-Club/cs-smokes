import { Link } from "react-router-dom"
import classes from "./profile-overview.module.scss"
import { UserProfile } from "@entities/user"
import { Button } from "@shared/ui/button"
import { useGetOwnProfile } from "@features/profile/get-own"

type ProfileOverviewProps = {
    userId: number | null
    isEditable?: boolean
}

export function ProfileOverview({ isEditable }: ProfileOverviewProps) {
    const { profile, isLoading } = useGetOwnProfile()

    if (!profile || isLoading) {
        return <div>Data was not provided...</div>
    }

    return (
        <div className={classes.container}>
            <h1 className={classes.title}>@{profile.username}</h1>
            <div className={classes.profile}>
                <UserProfile user={profile} isLoading={isLoading} />
            </div>
            {isEditable && (
                <Button size='lg' asChild className={classes.editButton}>
                    <Link to='/profile/edit'>Edit</Link>
                </Button>
            )}
            {isEditable && (
                <Button size='lg' asChild className={classes.editButton}>
                    <Link to='/profile/myGrenades'>My lineups</Link>
                </Button>
            )}
        </div>
    )
}
