import { Meta, StoryObj } from "@storybook/react"
import { expect } from "@storybook/test"
import { Skeleton } from "./skeleton"

const meta: Meta<typeof Skeleton> = {
    component: Skeleton,
    parameters: {
        layout: "centered",
    },
}

export default meta
type Story = StoryObj<typeof Skeleton>

export const Default: Story = {
    args: {
        widthInPixels: 200,
        heightInPixels: 35,
    },
    play: async ({ canvas }) => {
        const skeleton = canvas.getByLabelText("placeholder-skeleton")

        await expect(skeleton).toBeInTheDocument()
        // Size
        await expect(skeleton.style.width).toBe("200px")
        await expect(skeleton.style.height).toBe("35px")
    },
}
