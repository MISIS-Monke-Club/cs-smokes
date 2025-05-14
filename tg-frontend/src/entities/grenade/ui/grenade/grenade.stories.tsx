import { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, within } from "@storybook/test"
import { Canvas } from "@storybook/core/types"
import { grenadeModelMock } from "../../model/__mocks__"
import { Grenade } from "./grenade"
import classes from "./grenade.stories.module.scss"

// To remove boilerplate all mocks collected to this object
const baseTestFunction = async (canvas: Canvas) => {
    const card = canvas.getByLabelText("card")

    const title = within(card).getByText(grenadeModelMock.title)

    // Basic tests
    await expect(card).toBeInTheDocument()
    await expect(card).toBeVisible()

    // Title tests
    await expect(title).toBeInTheDocument()
    await expect(title).toBeVisible()
}

const meta: Meta<typeof Grenade> = {
    component: Grenade,
    args: {
        grenade: grenadeModelMock,
    },
    parameters: {
        layout: "centered",
    },
    play: async ({ canvas }) => {
        await baseTestFunction(canvas)
    },
}

export default meta

type Story = StoryObj<typeof Grenade>

export const Default: Story = {}

export const Redirect: Story = {
    play: async ({ canvas }) => {
        await baseTestFunction(canvas)

        const card = canvas.getByLabelText("card")
        await userEvent.click(card)
    },
}

export const CustomClassName: Story = {
    args: {
        className: classes.testClass,
    },
    play: async ({ canvas }) => {
        await baseTestFunction(canvas)

        const card = canvas.getByLabelText("card")
        await expect(card).toHaveClass(classes.testClass)
    },
}
