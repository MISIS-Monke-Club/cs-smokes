import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
    stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
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
