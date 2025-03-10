import { Grenades } from "@pages/grenades"
import { Layout } from "../layout"
import { Homepage } from "@pages/home-page"
import { createBrowserRouter } from "react-router-dom"
import { GrenadePage } from "@pages/grenade-page"

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
                    path: "grenades",
                    element: <Grenades />,
                },
                {
                    path: "grenades/:grenadeId",
                    element: <GrenadePage />,
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
