import { createBrowserRouter } from "react-router-dom"
import { Layout } from "../layout"
import { Grenades } from "@pages/grenades"
import { Homepage } from "@pages/home-page"
import { GrenadePage } from "@pages/grenade-page"
import { LoginPage } from "@pages/login-page"
import { ProfilePage } from "@pages/profile-page"
import { EditProfilePage } from "@pages/edit-profile-page"

export const router = createBrowserRouter(
    [
        {
            path: "/",
            element: <Layout />,
            errorElement: (
                <div>Oups... Cant find that page or something is broken</div>
            ),
            children: [
                {
                    path: "/",
                    element: <Homepage />,
                },
                {
                    path: "/login",
                    element: <LoginPage />,
                },
                {
                    path: "grenades",
                    element: <Grenades />,
                },
                {
                    path: "grenades/:grenadeId",
                    element: <GrenadePage />,
                },
                {
                    path: "/profile",
                    element: <ProfilePage isOwnProfile={true} />,
                },
                {
                    path: "/guest/profile/:id",
                    element: <ProfilePage isOwnProfile={false} />,
                },
                {
                    path: "/profile/edit",
                    element: <EditProfilePage />,
                },
            ],
        },
    ],
    {
        future: {
            v7_relativeSplatPath: true,
        },
    }
)
