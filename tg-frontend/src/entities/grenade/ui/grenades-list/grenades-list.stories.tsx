import { Meta, StoryObj } from "@storybook/react"
import { Canvas } from "storybook/internal/types"
import { expect } from "@storybook/test"
import { grenadesMaper } from "../../lib/grenade-maper"
import { grenadesModelMocks } from "../../model/__mocks__"
import { GrenadesListComponent } from "./grenades-list"

const baseTestFunction = async (canvas: Canvas) => {
    const cards = await canvas.findAllByLabelText("card")

    await expect(cards[0]).toBeInTheDocument()
    await expect(cards[0]).toBeVisible()
    await expect(cards).toHaveLength(grenadesModelMocks.length)
}

const meta: Meta<typeof GrenadesListComponent> = {
    component: GrenadesListComponent,
    parameters: {
        layout: "centered",
    },
    args: {
        mapFunction: grenadesMaper,
        grenades: grenadesModelMocks,
    },
    play: async ({ canvas }) => {
        await baseTestFunction(canvas)
    },
}

export default meta

type Story = StoryObj<typeof GrenadesListComponent>

export const Default: Story = {}

export const Error: Story = {
    args: {
        isError: true,
    },
    parameters: {
        layout: "centered",
    },
    play: async ({ canvas }) => {
        const errorMessage = await canvas.findByText(
            "Something went wrong in grenades list..."
        )

        await expect(errorMessage).toBeVisible()
        await expect(errorMessage).toBeInTheDocument()
    },
}

export const Loading: Story = {
    args: {
        isLoading: true,
    },
    parameters: {
        layout: "centered",
    },
    play: async ({ canvas }) => {
        const loadingSkeletons = await canvas.findAllByLabelText(
            "placeholder-skeleton"
        )

        await expect(loadingSkeletons).toHaveLength(5)
        await expect(loadingSkeletons[0]).toBeVisible()
        await expect(loadingSkeletons[0]).toBeInTheDocument()
    },
}
