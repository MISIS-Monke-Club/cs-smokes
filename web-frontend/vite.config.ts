/* eslint-disable import/no-default-export */
import path from "path"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"

// https://vitejs.dev/config/
export default defineConfig(() => {
    return {
        plugins: [react(), tailwindcss()],
        resolve: {
            alias: {
                "@scss": path.resolve("src/shared/scss"),
                "@app": path.resolve("src/app"),
                "@pages": path.resolve("src/pages"),
                "@widgets": path.resolve("src/widgets"),
                "@entities": path.resolve("src/entities"),
                "@features": path.resolve("src/features"),
                "@shared": path.resolve("src/shared"),
            },
        },
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: `
                        @use "@scss/_mixins.scss" as *;
                        @use "@scss/_media.scss" as *;
                    `,
                },
            },
        },
    }
})
