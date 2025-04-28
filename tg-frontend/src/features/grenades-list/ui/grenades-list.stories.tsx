import { Meta, StoryObj } from "@storybook/react"
import { Canvas } from "storybook/internal/types"
import { expect } from "@storybook/test"
import { GrenadesList } from "./grenades-list"
import { grenadesDTOmock, testGrenadesServer } from "@entities/grenade/dev"

const baseTestFunction = async (canvas: Canvas) => {
    const loadingPlaceholders = await canvas.findAllByLabelText(
        "placeholder-skeleton"
    )

    await expect(loadingPlaceholders).toHaveLength(5)

    const cards = await canvas.findAllByLabelText(
        "card",
        {},
        {
            timeout: 2000,
        }
    )

    await expect(cards[0]).toBeInTheDocument()
    await expect(cards[0]).toBeVisible()
    await expect(cards).toHaveLength(grenadesDTOmock.length)
}

const meta: Meta<typeof GrenadesList> = {
    component: GrenadesList,
    parameters: {
        layout: "centered",
        msw: {
            handlers: [testGrenadesServer(1000)],
        },
    },
    play: async ({ canvas }) => {
        await baseTestFunction(canvas)
    },
}

export default meta

type Story = StoryObj<typeof GrenadesList>

export const Default: Story = {}

export const LongLoading: Story = {
    parameters: {
        layout: "centered",
        msw: {
            handlers: [testGrenadesServer(3000)],
        },
    },
    play: async ({ canvas }) => {
        const loaders = await canvas.findAllByLabelText("placeholder-skeleton")

        await expect(loaders).toHaveLength(5)
        await expect(loaders[0]).toBeInTheDocument()
        await expect(loaders[0]).toBeVisible()

        const cards = canvas.queryAllByLabelText("card")

        await expect(cards).toHaveLength(0)

        const loadedCards = await canvas.findAllByLabelText(
            "card",
            {},
            {
                timeout: 4000,
            }
        )

        await expect(loadedCards).toHaveLength(grenadesDTOmock.length)
        await expect(loadedCards[0]).toBeInTheDocument()
        await expect(loadedCards[0]).toBeVisible()
    },
}
