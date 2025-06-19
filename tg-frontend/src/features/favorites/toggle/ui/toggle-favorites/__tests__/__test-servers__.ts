import { delay, http, HttpResponse } from "msw"
import { GrenadeModel } from "@entities/grenade"
import { BASE_BACKEND_URL } from "@shared/config/constants"

// POST
export const testFavoritesPostServer = () =>
    http.post(`${BASE_BACKEND_URL}/favorites`, async () => {
        await delay(2000)

        return new HttpResponse(null, {
            status: 201,
        })
    })
export const testFavoritesErrorPostServer = () =>
    http.post(`${BASE_BACKEND_URL}/favorites`, async () => {
        await delay(1500)

        return new HttpResponse(null, {
            status: 500,
        })
    })

// DELETE
export const testFavoritesDeleteServer = ({
    grenadeId,
}: Pick<GrenadeModel, "grenadeId">) =>
    http.delete(`${BASE_BACKEND_URL}/favorites/${grenadeId}`, async () => {
        await delay(2000)

        return new HttpResponse(null, {
            status: 204,
        })
    })
export const testFavoritesDeleteErrorServer = ({
    grenadeId,
}: Pick<GrenadeModel, "grenadeId">) =>
    http.delete(`${BASE_BACKEND_URL}/favorites/${grenadeId}`, async () => {
        await delay(1500)

        return new HttpResponse(null, {
            status: 500,
        })
    })
