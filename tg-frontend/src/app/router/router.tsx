import { createBrowserRouter } from "react-router-dom"
import { Layout } from "../layout"
import { Grenades } from "@pages/grenades"
import { Homepage } from "@pages/home-page"
import { GrenadePage } from "@pages/grenade-page"
import { LoginPage } from "@pages/login-page"
import { Maps } from "@pages/maps"
import { MapPage } from "@pages/map-page"
import { GuestProfilePage } from "@pages/guest-profile-page"
import { EditProfilePage } from "@pages/edit-profile-page"
import { OwnProfilePage } from "@pages/own-profile-page"
import { FavoritesPage } from "@pages/favorites-page"

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
                    path: "maps",
                    element: <Maps />,
                },
                {
                    path: "maps/:mapId",
                    element: <MapPage />,
                },
                {
                    path: "/profile",
                    element: <OwnProfilePage />,
                },
                {
                    path: "/guest/profile/:userId",
                    element: <GuestProfilePage />,
                },
                {
                    path: "/profile/edit",
                    element: <EditProfilePage />,
                },
                {
                    path: "/favorites",
                    element: <FavoritesPage />,
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
