import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import { idSchema } from "../domain"
import classes from "./profile-page.module.scss"
import { setUserId } from "@entities/session"
import { UserProfile } from "@entities/user"
import { userApi } from "@entities/user"
import { Button } from "@shared/ui/button"
import { selectUserId } from "@entities/session"

export const ProfilePage = ({ isOwnProfile }: { isOwnProfile: boolean }) => {
    const { id } = useParams<{ id?: string }>()
    const dispatch = useDispatch()

    const parsedId = id ? idSchema.safeParse(id) : null

    useEffect(() => {
        if (parsedId?.success) {
            dispatch(setUserId(parsedId.data))
        }
    }, [parsedId, dispatch])

    const userId = useSelector(selectUserId)

    const { data: user, isLoading } = useQuery(userApi.getUserById(userId))

    if (!parsedId?.success && location.pathname !== "/profile") {
        return <b>Неверный идентификатор пользователя</b>
    }

    if (isLoading) {
        return <b>Загрузка...</b>
    }

    if (!user) {
        return <b>Профиль не найден</b>
    }

    return (
        <div className={classes.container}>
            <h1 className={classes.title}>Профиль</h1>
            <div className={classes.profile}>
                <UserProfile user={user} />
            </div>
            {isOwnProfile && (
                <Button size='lg' asChild className={classes.editButton}>
                    <Link to='/profile/edit'>Редактировать профиль</Link>
                </Button>
            )}
        </div>
    )
}
