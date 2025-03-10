import { RouterProvider } from "react-router-dom"
import "./index.scss"
import "./tailwind.css"
import { Provider } from "react-redux"
import { store } from "./store/store"
import { router } from "./router/router"
import { QueryClientProvider } from "@tanstack/react-query"
import { client } from "@shared/api"
import { ThemeProvider } from "./providers/theme-provider"

export function App() {
    return (
        <Provider store={store}>
            <QueryClientProvider client={client}>
                <ThemeProvider>
                    <RouterProvider
                        router={router}
                        future={{
                            v7_startTransition: true,
                        }}
                    />
                </ThemeProvider>
            </QueryClientProvider>
        </Provider>
    )
}
