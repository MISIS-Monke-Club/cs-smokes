import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "")

    return {
        plugins: [react()],
        server: {
            host: true,
            port: 8001,
        },
        define: {
            __ADMIN_API_URL__: JSON.stringify(env.VITE_ADMIN_API_URL || env.VITE_BACKEND_URL || "http://localhost:3000/api"),
        },
    }
})
