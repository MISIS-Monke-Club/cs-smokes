import { AxiosError } from "axios"

type HandleAxiosErrorReturnType = {
    message: string
    status?: string
    statusCode?: number
    data?: object
}

export const handleAxiosError = (err: unknown): HandleAxiosErrorReturnType => {
    if (err instanceof AxiosError) {
        return {
            message: err.message,
            status: err.code,
            statusCode: err.status,
            data: err.response?.data,
        }
    }

    return {
        message: String(err),
    }
}
