import { createBrowserRouter } from "react-router-dom"
import { Layout } from "../layout"
import { LoginProvider } from "../providers/login-provider"
import { Homepage } from "@pages/home-page"
import { GrenadePage } from "@pages/grenade-page"
import { Maps } from "@pages/map/maps"
import { MapPage } from "@pages/map/map-page"
import { GuestProfilePage } from "@pages/guest-profile-page"
import { EditProfilePage } from "@pages/edit-profile-page"
import { OwnProfilePage } from "@pages/own-profile-page"
import { FavoritesPage } from "@pages/favorites-page"
import { AddLineupPage } from "@pages/add-lineup-page"
import { loginThunk, setupAuthSlice, setupInterceptors } from "@features/auth"
import { store } from "@shared/model"
import { GrenadesPage } from "@pages/grenades"
import { MapInfoPage } from "@pages/map/map-info"
import { selectAuthSession } from "@entities/session"

export const router = createBrowserRouter(
    [
        {
            path: "/",
            element: <Layout />,
            loader: () => {
                localStorage.clear()
                setupAuthSlice(store)
                setupInterceptors(store)
                if (!selectAuthSession(store.getState()).accessToken) {
                    store.dispatch(loginThunk())
                }

                return null
            },
            errorElement: (
                <div>Oups... Cant find that page or something is broken</div>
            ),
            children: [
                {
                    element: <LoginProvider />,
                    children: [
                        { path: "/", element: <Homepage /> },
                        {
                            path: "grenades",
                            element: <GrenadesPage />,
                        },
                        {
                            path: "grenades/:grenadeId",
                            element: <GrenadePage />,
                        },
                        {
                            path: "/grenades/create",
                            element: <AddLineupPage />,
                        },
                        {
                            path: "/requests/:requestId",
                            element: <AddLineupPage />,
                        },
                        {
                            path: "maps",
                            element: <Maps />,
                        },
                        {
                            path: "maps/:mapId",
                            element: <MapInfoPage />,
                        },
                        {
                            path: "maps/:mapId/grenades",
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
        },
    ],
    {
        future: {
            v7_relativeSplatPath: true,
        },
    }
)
