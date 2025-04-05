import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { toast } from "sonner"
import { guestPageParamSchema } from "./domain"
import { userApi } from "@entities/user"
import { ProfileOverview } from "@widgets/profile-overview/profile-overview"

export const ProfilePage = () => {
    const params = useParams()
    const userId: number = useMemo(() => {
        const idParser = guestPageParamSchema.safeParse(params)

        if (idParser.success) {
            return idParser.data.userId
        }

        toast.error("bad url")
        throw new Error(`bad url, wrong user id: "/profile/${params.userId}"`)
    }, [params])
    const { data: user, isLoading } = useQuery(userApi.getUserById(userId))

    if (isLoading) {
        return <b>Загрузка...</b>
    }

    if (!user) {
        return <b>Профиль не найден</b>
    }

    return (
        <>
            <h1>
                <b>GUEST</b> profile
            </h1>
            <ProfileOverview userId={userId} />
        </>
    )
}
