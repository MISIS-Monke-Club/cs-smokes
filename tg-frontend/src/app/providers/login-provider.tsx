import { Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import { selectAuthSession } from "@entities/session"
import { loginThunk } from "@features/auth"
import { Button } from "@shared/ui/button"

export function LoginProvider() {
    const authSession = useSelector(selectAuthSession)

    if (!authSession.accessToken)
        return (
            <div>
                loading, please wait...
                <Button onClick={() => loginThunk()}>Try again</Button>
            </div>
        )

    return <Outlet />
}
