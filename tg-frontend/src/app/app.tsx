import { RouterProvider } from "react-router-dom"
import "./index.scss"
import "./tailwind.css"
import { Provider } from "react-redux"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import React from "react"
import { store } from "./store/store"
import { router } from "./router/router"
import { ThemeProvider } from "./providers/theme-provider"
import { client } from "@shared/api"

const ReactQueryDevtoolsProduction = React.lazy(() =>
    import("@tanstack/react-query-devtools/build/modern/production.js").then(
        (d) => ({
            default: d.ReactQueryDevtools,
        })
    )
)

export function App() {
    const [showDevtools, setShowDevtools] = React.useState(false)

    React.useEffect(() => {
        // @ts-expect-error
        window.toggleDevtools = () => setShowDevtools((old) => !old)
    }, [])
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
                    <ReactQueryDevtools initialIsOpen={false} />
                    {showDevtools && (
                        <React.Suspense fallback={null}>
                            <ReactQueryDevtoolsProduction />
                        </React.Suspense>
                    )}
                </ThemeProvider>
            </QueryClientProvider>
        </Provider>
    )
}
