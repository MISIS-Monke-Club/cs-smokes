import { useLocation, useSearchParams } from "react-router-dom"

export function useQueryPrams() {
    const location = useLocation()
    const [searchParams, setSearchParams] = useSearchParams()

    const addParams = (key: string, value: string): void => {
        const queryParams = new URLSearchParams(location.search)
        queryParams.set(key, value)

        setSearchParams(queryParams)
    }

    const deleteParams = (key: string): void => {
        const queryParams = new URLSearchParams(location.search)
        queryParams.delete(key)

        setSearchParams(queryParams)
    }

    return {
        params: searchParams,
        addParams,
        deleteParams,
    }
}
