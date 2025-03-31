import { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent } from "@storybook/test"
import { Canvas } from "@storybook/core/types"
import { GrenadeModel } from "../../domain"
import { Grenade } from "./grenade"
import classes from "./grenade.stories.module.scss"

const meta: Meta<typeof Grenade> = {
    component: Grenade,
}

export default meta

type Story = StoryObj<typeof Grenade>

// To remove boilerplate all mocks collected to this object
const baseTestData: {
    mocks: GrenadeModel
    baseTestFunction: (canvas: Canvas) => Promise<unknown>
} = {
    mocks: {
        grenadeId: 1,
        mapId: 101,
        typeId: 5,
        grenadeClass: {
            name: "Flashbang",
            description: "A grenade that blinds enemies.",
            price: 200,
        },
        properties: [
            { key: "effect_duration", value: "2.5s" },
            { key: "radius", value: "400 units" },
        ],
        linkToVideo: "https://example.com/flashbang-guide",
        userId: 42,
        createdAt: "2024-03-22T12:00:00Z",
        title: "Perfect Flash for Mid Push",
        description:
            "This flashbang is great for rushing mid without getting seen.",
        isApproved: true,
        views: 1342,
        previewImageLink: "https://example.com/flashbang-preview.jpg",
    },
    baseTestFunction: async (canvas) => {
        const card = canvas.getByLabelText("card")

        // canvas children
        const title = canvas.getByText(
            `Grenade id:${baseTestData.mocks.grenadeId}`
        )
        const createdAt = canvas.getByText("Created at:22.3")

        // Basic tests of canvas
        await expect(card).toBeInTheDocument()
        await expect(card).toBeVisible()

        // Title tests
        await expect(title).toBeInTheDocument()
        await expect(title).toBeVisible()

        // Created at tests
        await expect(createdAt).toBeInTheDocument()
        await expect(createdAt).toBeVisible()
    },
}

export const Default: Story = {
    args: {
        grenade: baseTestData.mocks,
    },
    play: async ({ canvas }) => {
        await baseTestData.baseTestFunction(canvas)
    },
}

export const Redirect: Story = {
    args: {
        grenade: baseTestData.mocks,
    },
    play: async ({ canvas }) => {
        const card = canvas.getByLabelText("card")

        await baseTestData.baseTestFunction(canvas)

        await userEvent.click(card)
    },
}

export const CustomClassName: Story = {
    args: {
        grenade: baseTestData.mocks,
        className: classes.testClass,
    },
    play: async ({ canvas }) => {
        const card = canvas.getByLabelText("card")

        await baseTestData.baseTestFunction(canvas)
        await expect(card).toHaveClass(classes.testClass)
    },
}
