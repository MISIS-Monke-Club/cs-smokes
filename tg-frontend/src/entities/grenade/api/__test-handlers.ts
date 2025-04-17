import { delay, http, HttpResponse } from "msw"
import { api } from "./client"
import { mockGrenade, mockGrenades } from "./__mocks"
import { BASE_BACKEND_URL } from "@shared/config/constants"

export const testGrenadeServer = ({
    grenadeId,
    delayInMs = 200,
}: {
    grenadeId: number
    delayInMs: number
}) =>
    http.get(`${BASE_BACKEND_URL}/${api.baseApiUrl}/${grenadeId}`, async () => {
        await delay(delayInMs)

        return HttpResponse.json(mockGrenade)
    })

export const testGrenadesServer = (delayInMs: number) =>
    http.get(`${BASE_BACKEND_URL}/${api.baseApiUrl}`, async () => {
        await delay(delayInMs)

        return HttpResponse.json(mockGrenades)
    })
