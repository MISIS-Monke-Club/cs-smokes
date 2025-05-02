import { Meta, StoryObj } from "@storybook/react"
import { Grenades } from "./grenades"
import { testGrenadesServer } from "@entities/grenade/dev"

const meta: Meta<typeof Grenades> = {
    component: Grenades,
    parameters: {
        layout: "centered",
        msw: {
            handlers: [testGrenadesServer(200)],
        },
    },
}

export default meta

type Story = StoryObj<typeof Grenades>

export const Default: Story = {}
