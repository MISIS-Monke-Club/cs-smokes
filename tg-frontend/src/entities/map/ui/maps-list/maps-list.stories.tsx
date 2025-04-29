import { Meta, StoryObj } from "@storybook/react"
import { testMapsServer } from "../../api/__test-handler__"
import { MapsList } from "./maps-list"

const meta: Meta<typeof MapsList> = {
    component: MapsList,
    parameters: {
        reactQueryDevTools: true,
        msw: {
            handlers: [testMapsServer({ delayInMs: 200 })],
        },
        layout: "centered",
    },
}

export default meta

type Story = StoryObj<typeof MapsList>

export const Default: Story = {}
