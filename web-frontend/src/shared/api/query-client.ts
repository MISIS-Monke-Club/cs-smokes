import { QueryClient } from "@tanstack/react-query"

export const client = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1 * 60 * 1000,
            retry: false,
        },
    },
})
