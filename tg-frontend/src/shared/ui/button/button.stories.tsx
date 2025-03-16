import { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent } from "@storybook/test"
import { Button } from "./button"

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

export const Disabled: Story = {
    args: {
        children: "button",
        disabled: true,
    },
    play: async ({ canvas }) => {
        const button = canvas.getByText("button")

        await expect(button).toBeDisabled()
    },
}

export const AsChild: Story = {
    args: {
        children: (
            <a style={{ pointerEvents: "none" }} href='/'>
                Link
            </a>
        ),
        disabled: true,
        asChild: true,
    },
    play: async ({ canvas }) => {
        const button = canvas.getByRole("link", { name: "Link" })

        await expect(button).toBeInTheDocument()
    },
}
