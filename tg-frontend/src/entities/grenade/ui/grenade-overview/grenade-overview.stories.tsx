import { Meta, StoryObj } from "@storybook/react"
import { expect } from "@storybook/test"
import { grenadeModelMock } from "../../model/__mocks__"
import { GrenadeOverview } from "./grenade-overview"
import { baseTestFunction, oppositeTestFunction } from "./__tests__"
import { Button } from "@shared/ui/button"

const meta: Meta<typeof GrenadeOverview> = {
    component: GrenadeOverview,
    parameters: {
        layout: "centered",
    },
    args: {
        grenade: grenadeModelMock,
    },
    play: async ({ canvas }) => {
        await baseTestFunction(canvas)
    },
}

export default meta

type Story = StoryObj<typeof GrenadeOverview>

export const Default: Story = {}

export const Loading: Story = {
    args: {
        isLoading: true,
    },
    play: async ({ canvas }) => {
        await oppositeTestFunction(canvas)

        const loader = canvas.getByTestId("grenade-overview-loader")

        await expect(loader).toBeInTheDocument()
        await expect(loader).toBeVisible()
        await expect(loader).toHaveTextContent("Loading...")
    },
}

export const Error: Story = {
    args: {
        isError: true,
    },
    play: async ({ canvas }) => {
        await oppositeTestFunction(canvas)

        const errorPlaceholder = canvas.getByTestId(
            "data-overview-error-placeholder"
        )

        await expect(errorPlaceholder).toBeInTheDocument()
        await expect(errorPlaceholder).toBeVisible()
        await expect(errorPlaceholder).toHaveTextContent(
            "Something went wrong with grenade overview..."
        )
    },
}

export const WithActions: Story = {
    args: {
        actions: (
            <Button
                variant='secondary'
                data-testid='grenade-overview-fake-action'
            >
                click me
            </Button>
        ),
    },
    play: async ({ canvas }) => {
        await baseTestFunction(canvas)

        const fakeAction = canvas.getByTestId("grenade-overview-fake-action")

        await expect(fakeAction).toBeInTheDocument()
        await expect(fakeAction).toBeVisible()
        await expect(fakeAction).toHaveTextContent("click me")
    },
}
