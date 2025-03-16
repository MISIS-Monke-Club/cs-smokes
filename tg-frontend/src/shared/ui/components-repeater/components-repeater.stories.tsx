import { Meta, StoryObj } from "@storybook/react"
import { expect } from "@storybook/test"
import { Skeleton } from "../skeleton"
import { ComponentsRepeater } from "./components-repeater"

const meta: Meta<typeof ComponentsRepeater> = {
    component: ComponentsRepeater,
    parameters: {
        layout: "centered",
    },
    args: {
        children: "value to be copied",
        length: 10,
    },
}

export default meta
type Story = StoryObj<typeof ComponentsRepeater>

export const Default: Story = {
    args: {
        children: (
            <>
                <div aria-label='copied-value'>Value</div>
            </>
        ),
        length: 9,
    },
    play: async ({ canvas }) => {
        const list = canvas.getAllByLabelText("copied-value")

        await expect(list).toHaveLength(9)
    },
}

export const RandomizedWidth: Story = {
    args: {
        children: <Skeleton style={{ width: "100%", height: "30px" }} />,
        randomizedWidth: true,
        minWidthValue: 60,
        maxWidthValue: 100,
        length: 9,
    },
    decorators: (Story) => (
        <div
            style={{
                width: "100px",
                display: "flex",
                flexDirection: "column",
                gap: "5px",
            }}
        >
            <Story />
        </div>
    ),
    play: async ({ canvas }) => {
        const elements = canvas.getAllByLabelText("copied-element")

        await expect(
            elements.every((el) => {
                const width: number = Number(el.style.width.replace("%", ""))

                return width >= 60 && width <= 100
            })
        ).toBeTruthy()
    },
}
