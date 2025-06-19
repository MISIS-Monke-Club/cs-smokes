import { Meta, StoryObj } from "@storybook/react"
import { expect } from "@storybook/test"
import { MapOverview } from "./map-overview"
import { mockMapPage, testMapPageServer } from "@entities/map/dev"
import { testGrenadeServer } from "@entities/grenade/dev"

const meta: Meta<typeof MapOverview> = {
    component: MapOverview,
    parameters: {
        reactQueryDevTools: true,
        msw: {
            handlers: [
                // Map
                testMapPageServer({
                    mapId: mockMapPage.map_id,
                    delayInMs: 300,
                }),
                // Grenades
                testGrenadeServer({
                    grenadeId: mockMapPage.map_lineups[0].grenade_id,
                    customData: mockMapPage.map_lineups[0],
                    delayInMs: 200,
                }),
                testGrenadeServer({
                    grenadeId: mockMapPage.map_lineups[1].grenade_id,
                    customData: mockMapPage.map_lineups[1],
                    delayInMs: 250,
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
