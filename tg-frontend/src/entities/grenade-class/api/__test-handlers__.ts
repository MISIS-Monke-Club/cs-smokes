import { delay, http, HttpResponse } from "msw"
import { grenadeClassesDTOMock } from "../model/__mocks__"
import { api } from "./client"
import { BASE_BACKEND_URL } from "@shared/config/constants"

export const testGrenadeClassesServer = (delayInMs: number = 200) =>
    http.get(`${BASE_BACKEND_URL}/${api.baseApiUrl}`, async () => {
        await delay(delayInMs)
        return HttpResponse.json(grenadeClassesDTOMock)
    })
