import { delay, http, HttpResponse } from "msw"
import { grenadeDTOmock, grenadesDTOmock } from "../model/__mocks"
import { api } from "./client"
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

        return HttpResponse.json(grenadeDTOmock)
    })

export const testGrenadesServer = (delayInMs: number) =>
    http.get(`${BASE_BACKEND_URL}/${api.baseApiUrl}`, async () => {
        await delay(delayInMs)

        return HttpResponse.json(grenadesDTOmock)
    })
