import { delay, http, HttpResponse } from "msw"
import { z } from "zod"
import { grenadeDTOmock, grenadesDTOmock } from "../model/__mocks"
import { grenadeDTOschema } from "../model/domain"
import { api } from "./client"
import { BASE_BACKEND_URL } from "@shared/config/constants"

export const testGrenadeServer = ({
    grenadeId,
    delayInMs = 200,
    customData,
}: {
    grenadeId: number
    delayInMs: number
    customData?: z.infer<typeof grenadeDTOschema>
}) =>
    http.get(`${BASE_BACKEND_URL}/${api.baseApiUrl}/${grenadeId}`, async () => {
        await delay(delayInMs)

        if (customData) {
            return HttpResponse.json(customData)
        } else {
            return HttpResponse.json(grenadeDTOmock)
        }
    })

export const testGrenadesServer = (delayInMs: number) =>
    http.get(`${BASE_BACKEND_URL}/${api.baseApiUrl}`, async () => {
        await delay(delayInMs)

        return HttpResponse.json(grenadesDTOmock)
    })
