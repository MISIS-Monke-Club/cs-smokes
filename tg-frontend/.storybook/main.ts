import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
    stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
    env: (config) => ({
        ...config,
        VITE_BACKEND_URL: "http://localhost:3000/api",
        VITE_IN_TG_ENVIRONMENT: "false",
    }),
    addons: [
        "@storybook/addon-essentials",
        "@storybook/addon-onboarding",
        "@storybook/experimental-addon-test",
        "@chromatic-com/storybook",
        "@storybook/addon-mdx-gfm",
    ],
    typescript: {
        check: true,
        reactDocgen: "react-docgen-typescript",
    },
    framework: {
        name: "@storybook/react-vite",
        options: {},
    },
    docs: {
        autodocs: true,
    },
    staticDirs: ["../public"],
}
export default config
