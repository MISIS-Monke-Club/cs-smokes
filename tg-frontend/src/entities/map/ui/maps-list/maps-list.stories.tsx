import { Meta, StoryObj } from "@storybook/react"
import { http, HttpResponse } from "msw"
import { mapApi } from "../.."
import { testData } from "./__mocks"
import { MapsList } from "./maps-list"
import { BASE_BACKEND_URL } from "@shared/config/constants"

const meta: Meta<typeof MapsList> = {
    component: MapsList,
    parameters: {
        reactQueryDevTools: true,
        msw: {
            handlers: [
                http.get(`${BASE_BACKEND_URL}/${mapApi.baseApiUrl}`, () => {
                    return HttpResponse.json(testData)
                }),
            ],
        },
        layout: "centered",
    },
}

export default meta

type Story = StoryObj<typeof MapsList>

export const Default: Story = {}
