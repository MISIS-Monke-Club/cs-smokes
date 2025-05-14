import { createBrowserRouter } from "react-router-dom"
import { Layout } from "../layout"
import { LoginProvider } from "../providers/login-provider"
import { Grenades } from "@pages/grenades"
import { Homepage } from "@pages/home-page"
import { GrenadePage } from "@pages/grenade-page"
import { Maps } from "@pages/maps"
import { MapPage } from "@pages/map-page"
import { GuestProfilePage } from "@pages/guest-profile-page"
import { EditProfilePage } from "@pages/edit-profile-page"
import { OwnProfilePage } from "@pages/own-profile-page"
import { FavoritesPage } from "@pages/favorites-page"
import { AddLineupPage } from "@pages/add-lineup-page"
import { loginThunk, setupAuthSlice, setupInterceptors } from "@features/auth"
import { store } from "@shared/model"
import { MyGrenadesList } from "@pages/my-grenades-page"

export const router = createBrowserRouter(
    [
        {
            path: "/",
            element: <Layout />,
            loader: () => {
                setupAuthSlice(store)
                setupInterceptors(store)
                store.dispatch(loginThunk())

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
                            element: <Grenades />,
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
                        {
                            path: "profile/myGrenades",
                            element: <MyGrenadesList />,
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
