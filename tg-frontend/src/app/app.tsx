import { RouterProvider } from "react-router-dom"
import "./index.scss"
import "./tailwind.css"
import { Provider } from "react-redux"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { router } from "./router/router"
import { ThemeProvider } from "./providers/theme-provider"
import { store } from "@shared/model"
import { client } from "@shared/api"

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
                    <Toaster
                        duration={3500}
                        closeButton
                        richColors
                        theme='system'
                    />
                </ThemeProvider>
                <ReactQueryDevtools />
            </QueryClientProvider>
        </Provider>
    )
}
