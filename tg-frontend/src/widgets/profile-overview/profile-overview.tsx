import { Link } from "react-router-dom"
import { useDispatch } from "react-redux"
import { useQuery } from "@tanstack/react-query"
import classes from "./profile-overview.module.scss"
import { userApi, UserProfile } from "@entities/user"
import { Button } from "@shared/ui/button"
import { setUserId } from "@entities/session"

type ProfileOverviewProps = {
    userId: number | null
    isEditable?: boolean
}

export function ProfileOverview({ userId, isEditable }: ProfileOverviewProps) {
    const {
        data: userData,
        isLoading,
        isError,
    } = useQuery(userApi.getUserById(userId))

    // TODO: REMOVE THIS PLACEHOLDER
    const dispatch = useDispatch()
    function handleClick() {
        dispatch(setUserId(1))
    }

    if (isLoading) {
        return (
            <div>
                <b>Загрузка...</b>
            </div>
        )
    }

    if (isError && userId) {
        return (
            <div>
                <b>Произошла ошибка...</b>
            </div>
        )
    }

    if (!userId) {
        return (
            <div>
                <div>
                    Looks like you <b>NOT AUTHORIZED</b>. Want to log in?
                </div>
                {/* TODO: REMOVE THIS PLACEHOLDER */}
                <Button onClick={handleClick}>Login with userId = 1</Button>
            </div>
        )
    }

    return (
        <div className={classes.container}>
            <h1 className={classes.title}>Профиль</h1>
            <div className={classes.profile}>
                <UserProfile user={userData} />
            </div>
            {isEditable && (
                <Button size='lg' asChild className={classes.editButton}>
                    <Link to='/profile/edit'>Редактировать профиль</Link>
                </Button>
            )}
        </div>
    )
}
