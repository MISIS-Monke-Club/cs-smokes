import { Meta, StoryObj } from "@storybook/react"
import { AddToFavorites } from "./add-to-favorites"
import { baseTestFunction } from "./__tests__"
import { grenadeDTOmock } from "@entities/grenade/dev"

const meta: Meta<typeof AddToFavorites> = {
    component: AddToFavorites,
    args: {
        grenadeId: grenadeDTOmock.grenade_id,
    },
    parameters: {
        layout: "centered",
    },
    play: async ({ canvas }) => {
        await baseTestFunction(canvas)
    },
}

export default meta

type Story = StoryObj<typeof AddToFavorites>

export const Default: Story = {}
