import { Meta, StoryObj } from "@storybook/react"
import { http, HttpResponse } from "msw"
import { expect } from "@storybook/test"
import { MapOverview } from "./map-overview"
import { testData } from "./__mocks"
import { BASE_BACKEND_URL } from "@shared/config/constants"
import { mapApi } from "@entities/map"

const meta: Meta<typeof MapOverview> = {
    component: MapOverview,
    parameters: {
        reactQueryDevTools: true,
        msw: {
            handlers: [
                http.get(
                    `${BASE_BACKEND_URL}/${mapApi.baseApiUrl}/${testData.map_id}`,
                    () => {
                        return HttpResponse.json(testData)
                    }
                ),
            ],
        },
        layout: "centered",
    },
    args: {
        mapId: testData.map_id,
    },
    play: async ({ canvas }) => {
        const loaderPlaceholder = await canvas.findAllByLabelText(
            "placeholder-skeleton"
        )

        await expect(loaderPlaceholder).toHaveLength(15)
        await expect(loaderPlaceholder[0]).toBeInTheDocument()
        await expect(loaderPlaceholder[0]).toBeVisible()

        // Waiting for the end of the request
        const title = await canvas.findByRole("heading", { level: 1 })

        await expect(title).toHaveTextContent(testData.name)
        await expect(title).toBeVisible()
    },
}

export default meta

type Story = StoryObj<typeof MapOverview>

export const Default: Story = {}
