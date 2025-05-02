import { Meta, StoryObj } from "@storybook/react"
import { expect, waitFor } from "@storybook/test"
import { Canvas } from "storybook/internal/types"
import { GetGrenadeById } from "./get-grenade-by-id"
import {
    grenadeOverviewTestFunc,
    grenadeDTOmock,
    testGrenadeServer,
} from "@entities/grenade/dev"

const baseTestFunction = async (canvas: Canvas) => {
    const loader = canvas.getByTestId("grenade-overview-loader")

    await expect(loader).toBeInTheDocument()
    await expect(loader).toBeVisible()
}

const meta: Meta<typeof GetGrenadeById> = {
    component: GetGrenadeById,
    parameters: {
        layout: "centered",
        msw: {
            handlers: [
                testGrenadeServer({
                    grenadeId: grenadeDTOmock.grenade_id,
                    delayInMs: 200,
                }),
            ],
        },
    },
    args: {
        grenadeId: grenadeDTOmock.grenade_id,
    },
    play: async ({ canvas }) => {
        await baseTestFunction(canvas)

        await waitFor(grenadeOverviewTestFunc.bind(null, canvas), {
            timeout: 2000,
        })
    },
}

export default meta

type Story = StoryObj<typeof GetGrenadeById>

export const Default: Story = {}

export const LongRequest: Story = {
    parameters: {
        msw: {
            handlers: [
                testGrenadeServer({
                    grenadeId: grenadeDTOmock.grenade_id,
                    delayInMs: 4000,
                }),
            ],
        },
    },
    play: async ({ canvas }) => {
        await baseTestFunction(canvas)

        await waitFor(grenadeOverviewTestFunc.bind(null, canvas), {
            timeout: 6000,
        })
    },
}
