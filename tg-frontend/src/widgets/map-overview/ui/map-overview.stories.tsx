import { Meta, StoryObj } from "@storybook/react"
import { expect } from "@storybook/test"
import { MapOverview } from "./map-overview"
import { mockMapPage, testMapPageServer } from "@entities/map"

const meta: Meta<typeof MapOverview> = {
    component: MapOverview,
    parameters: {
        reactQueryDevTools: true,
        msw: {
            handlers: [
                testMapPageServer({
                    mapId: mockMapPage.map_id,
                    delayInMs: 300,
                }),
            ],
        },
        layout: "centered",
    },
    args: {
        mapId: mockMapPage.map_id,
    },
    play: async ({ canvas }) => {
        const loaderPlaceholder = await canvas.findAllByLabelText(
            "placeholder-skeleton"
        )

        await expect(loaderPlaceholder).toHaveLength(15)
        await expect(loaderPlaceholder[0]).toBeInTheDocument()
        await expect(loaderPlaceholder[0]).toBeVisible()

        // Waiting for the end of the request
        const title = await canvas.findByRole(
            "heading",
            { level: 1 },
            {
                timeout: 2000,
            }
        )

        await expect(title).toHaveTextContent(mockMapPage.name)
        await expect(title).toBeVisible()
    },
}

export default meta

type Story = StoryObj<typeof MapOverview>

export const Default: Story = {}
