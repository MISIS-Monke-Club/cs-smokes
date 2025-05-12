/* eslint-disable @typescript-eslint/consistent-type-definitions */
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BACKEND_URL: string
    readonly VITE_IN_TG_ENVIRONMENT: string
    readonly VITE_TG_INIT_DATA: string
}
