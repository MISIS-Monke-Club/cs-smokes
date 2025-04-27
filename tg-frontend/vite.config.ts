/* eslint-disable import/no-default-export */
import path from "path"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import dotenv from "dotenv"
import { z } from "zod"
import tailwindcss from "@tailwindcss/vite"

const envSchema = z.object({
    VITE_BACKEND_URL: z.string().nonempty(),
    IN_TG_ENVIRONMENT: z.string().nonempty(),
})

// https://vitejs.dev/config/
export default defineConfig(() => {
    // Parsing env (docker env has first priority)
    dotenv.config({ override: false })

    // Validate env
    envSchema.parse(process.env)

    return {
        server: {
            host: true,
            allowedHosts: ["*"],
        },
        build: {
            rollupOptions: {
                external: (id) => id.includes("/__"),
            },
        },
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
