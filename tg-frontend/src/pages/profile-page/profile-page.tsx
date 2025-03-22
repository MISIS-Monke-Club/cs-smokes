import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import classes from "./profile-page.module.scss"
import { setUserId } from "@entities/session"
import { RootState } from "@shared/store"
import { UserProfile } from "@entities/user"
import { userApi } from "@entities/user"

export const ProfilePage = () => {
    const { id } = useParams<{ id?: string }>()
    const dispatch = useDispatch()

    useEffect(() => {
        if (id) {
            dispatch(setUserId(parseInt(id, 10)))
        }
    }, [id, dispatch])

    const userId = useSelector((state: RootState) => state.user.userId)

    const { data: user, isLoading } = useQuery(userApi.getUserById(userId))

    if (isLoading) return <b>Загрузка...</b>
    if (!user) return <p>Профиль не найден</p>

    return (
        <div className={classes.container}>
            <h1 className={classes.title}>Профиль</h1>
            <UserProfile user={user} />
        </div>
    )
}
