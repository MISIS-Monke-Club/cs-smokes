import type { Preview } from "@storybook/react"
import "../src/app/tailwind.css"
import "../src/app/index.scss"
import { themes } from "storybook/internal/theming"
import { ThemeProvider } from "../src/app/providers/theme-provider"
import { MemoryRouter } from "react-router-dom"
import React from "react"

const preview: Preview = {
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
    decorators: [
        (Story) => (
            <ThemeProvider>
                <MemoryRouter initialEntries={["/"]}>
                    <Story />
                </MemoryRouter>
            </ThemeProvider>
        ),
    ],
    tags: ["autodocs"],
}

export default preview
