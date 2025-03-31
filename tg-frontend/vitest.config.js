/* eslint-disable import/no-default-export */
import { defineConfig } from "vite"

export default defineConfig({
    test: {
        coverage: {
            exclude: ["**/index.ts"],
        },
    },
})
