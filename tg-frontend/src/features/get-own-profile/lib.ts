import { useSelector } from "react-redux"
import { useQuery } from "@tanstack/react-query"
import { selectUserId } from "@entities/session"
import { userApi } from "@entities/user"

export function useGetOwnProfile() {
    const userId = useSelector(selectUserId)
    const profile = useQuery(userApi.getUserById(userId))

    return { profile, userId }
}
