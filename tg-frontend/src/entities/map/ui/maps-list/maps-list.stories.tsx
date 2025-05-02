import { Meta, StoryObj } from "@storybook/react"
import { mockMapsModel } from "../../model/__mocks__"
import { MapsList } from "./maps-list"

const meta: Meta<typeof MapsList> = {
    component: MapsList,
    args: {
        maps: mockMapsModel,
    },
    parameters: {
        layout: "centered",
    },
}

export default meta

type Story = StoryObj<typeof MapsList>

export const Default: Story = {}
