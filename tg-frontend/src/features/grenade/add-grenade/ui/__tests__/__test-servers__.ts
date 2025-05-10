import { delay, http, HttpResponse } from "msw"
import { BASE_BACKEND_URL } from "@shared/config/constants"

// POST
export const testAddLineupSuccess = () =>
    http.post(`${BASE_BACKEND_URL}/lineups`, async () => {
        await delay(2000)

        return new HttpResponse(null, {
            status: 201,
        })
    })

export const testAddLineupError = () =>
    http.post(`${BASE_BACKEND_URL}/lineups`, async () => {
        await delay(1500)

        return new HttpResponse(null, {
            status: 500,
        })
    })
