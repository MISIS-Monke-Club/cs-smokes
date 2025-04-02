import { Meta, StoryObj } from "@storybook/react"
import { http, HttpResponse } from "msw"
import { MapsWidget } from "./maps-widget"
import { testData } from "./__mocks"
import { BASE_BACKEND_URL } from "@shared/config/constants"
import { mapApi } from "@entities/map"

const meta: Meta<typeof MapsWidget> = {
    component: MapsWidget,
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

type Story = StoryObj<typeof MapsWidget>

export const Default: Story = {}
