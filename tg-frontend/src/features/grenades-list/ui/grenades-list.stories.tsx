import { Meta, StoryObj } from "@storybook/react"
import { Canvas } from "storybook/internal/types"
import { expect } from "@storybook/test"
import { delay, http, HttpResponse } from "msw"
import { GrenadesList } from "./grenades-list"
import { grenadeApi, mockServerGrenades } from "@entities/grenade"
import { BASE_BACKEND_URL } from "@shared/config/constants"

const baseTestFunction = async (canvas: Canvas) => {
    const loadingPlaceholders = await canvas.findAllByLabelText(
        "placeholder-skeleton"
    )

    await expect(loadingPlaceholders).toHaveLength(5)

    const cards = await canvas.findAllByLabelText("card")

    await expect(cards[0]).toBeInTheDocument()
    await expect(cards[0]).toBeVisible()
    await expect(cards.length).toEqual(mockServerGrenades.length)
}

const meta: Meta<typeof GrenadesList> = {
    component: GrenadesList,
    parameters: {
        layout: "centered",
        msw: {
            handlers: [
                http.get(
                    `${BASE_BACKEND_URL}/${grenadeApi.baseApiUrl}`,
                    async () => {
                        await delay()

                        return HttpResponse.json(mockServerGrenades)
                    }
                ),
            ],
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
            handlers: [
                http.get(
                    `${BASE_BACKEND_URL}/${grenadeApi.baseApiUrl}`,
                    async () => {
                        await delay(3000)

                        return HttpResponse.json(mockServerGrenades)
                    }
                ),
            ],
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

        await expect(loadedCards).toHaveLength(mockServerGrenades.length)
        await expect(loadedCards[0]).toBeInTheDocument()
        await expect(loadedCards[0]).toBeVisible()
    },
}
