import { useQuery } from "@tanstack/react-query"
import classes from "./profile-page.module.scss"
import { UserProfile } from "@entities/user"
import { userApi } from "@entities/user"

export const ProfilePage = () => {
    const { data: user, isLoading } = useQuery(userApi.getUser())

    if (isLoading) return <b>Загрузка...</b>
    if (!user) return <p>Профиль не найден</p>

    return (
        <>
            <h1 className={classes.title}>Профиль</h1>
            <UserProfile user={user} />
        </>
    )
}
