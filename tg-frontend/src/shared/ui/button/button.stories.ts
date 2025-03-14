import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "./button"
import { expect, userEvent } from "@storybook/test"

const meta: Meta<typeof Button> = {
    component: Button,
    parameters: {
        layout: "centered",
    },
    args: {
        children: "button",
    },
}

export default meta

type Story = StoryObj<typeof Button>

export const Default: Story = {
    play: async ({ canvas }) => {
        const secondaryButton = canvas.getByText("button")

        await userEvent.hover(secondaryButton)
        await userEvent.click(secondaryButton)
        await userEvent.tab()

        await expect(canvas.getByText("button")).toBeInTheDocument()
    },
}
