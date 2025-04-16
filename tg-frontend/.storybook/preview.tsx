import type { Preview } from "@storybook/react"
import { themes } from "storybook/internal/theming"
import { ThemeProvider } from "../src/app/providers/theme-provider"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import React from "react"
import { Toaster } from "sonner"
import { initialize, mswLoader } from "msw-storybook-addon"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { QueryClientProvider } from "@tanstack/react-query"
import { client } from "../src/shared/api"
import "../src/app/tailwind.css"
import { store } from "../src/app/store/store"
import { Provider } from "react-redux"
import "../src/app/index.scss"

initialize()

const preview: Preview = {
    loaders: [mswLoader],
    parameters: {
        docs: {
            theme: themes.dark,
        },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
        backgrounds: {
            values: [
                { name: "Dark", value: "oklch(0.145 0 0)" },
                { name: "Light", value: "oklch(1 0 0)" },
            ],
        },
    },
    beforeEach: () => client.clear(),
    decorators: [
        (Story, context) => (
            <Provider store={store}>
                <ThemeProvider>
                    <QueryClientProvider client={client}>
                        <MemoryRouter
                            initialEntries={
                                context.parameters.route
                                    ? [context.parameters.route]
                                    : ["/*"]
                            }
                        >
                            <Routes>
                                <Route
                                    path={context.parameters.routeSetup || "/*"}
                                    element={<Story />}
                                />
                            </Routes>
                        </MemoryRouter>
                        <Toaster
                            duration={3500}
                            closeButton
                            richColors
                            theme='system'
                        />
                        {context.parameters.reactQueryDevTools && (
                            <ReactQueryDevtools initialIsOpen={false} />
                        )}
                    </QueryClientProvider>
                </ThemeProvider>
            </Provider>
        ),
    ],
    tags: ["autodocs"],
}

export default preview
