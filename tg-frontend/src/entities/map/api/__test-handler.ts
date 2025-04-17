import { delay, http, HttpResponse } from "msw"
import { api } from "./client"
import { mockMapPage, mockMaps } from "./__mocks"
import { BASE_BACKEND_URL } from "@shared/config/constants"

export const testMapPageServer = ({
    mapId,
    delayInMs = 200,
}: {
    mapId: number
    delayInMs?: number
}) =>
    http.get(`${BASE_BACKEND_URL}/${api.baseApiUrl}/${mapId}`, async () => {
        await delay(delayInMs)

        return HttpResponse.json(mockMapPage)
    })

export const testMapsServer = ({ delayInMs = 200 }: { delayInMs: number }) =>
    http.get(`${BASE_BACKEND_URL}/${api.baseApiUrl}`, async () => {
        await delay(delayInMs)

        return HttpResponse.json(mockMaps)
    })
