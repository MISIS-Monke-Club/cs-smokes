import { Meta, StoryObj } from "@storybook/react"
import { expect } from "@storybook/test"
import { mockMapModel } from "../../model/__mocks__"
import { MapCard } from "./map-card"

const meta: Meta<typeof MapCard> = {
    component: MapCard,
    parameters: {
        layout: "centered",
    },
    args: {
        map: mockMapModel,
    },
    play: async ({ canvas }) => {
        // Basic tests for all card
        const mapCard = canvas.getByLabelText("map-card")

        await expect(mapCard).toBeInTheDocument()
        await expect(mapCard).toBeVisible()

        // Title of the map
        const title = canvas.getByText(mockMapModel.name)

        await expect(title).toBeVisible()
        await expect(title).toBeInTheDocument()

        // Image section
        const image = canvas.getByRole("img")

        await expect(image).toBeInTheDocument()
        await expect(image).toBeVisible()
        await expect(image).toHaveAttribute("src", mockMapModel.imageLink)
    },
}

export default meta

type Story = StoryObj<typeof MapCard>

export const Default: Story = {}
