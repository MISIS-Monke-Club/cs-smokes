import { Layout } from "../layout"
import { Homepage } from "@pages/home-page"
import { createBrowserRouter } from "react-router-dom"

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
            ],
        },
    ],
    {
        future: {
            v7_relativeSplatPath: true,
        },
    }
)
