import { Meta, StoryObj } from "@storybook/react"
import { baseTestFunction } from "./__tests__"
import { DeleteFromFavorites } from "./delete-from-favorites"
import { grenadeDTOmock } from "@entities/grenade/dev"

const meta: Meta<typeof DeleteFromFavorites> = {
    component: DeleteFromFavorites,
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

type Story = StoryObj<typeof DeleteFromFavorites>

export const Default: Story = {}
