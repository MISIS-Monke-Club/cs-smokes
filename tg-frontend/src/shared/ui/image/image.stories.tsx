import { Meta, StoryObj } from "@storybook/react"
import { expect } from "@storybook/test"
import { ImageComponent } from "./image"
import classes from "./image.stories.module.scss"

const meta: Meta<typeof ImageComponent> = {
    component: ImageComponent,
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        url: "/grenade-image.jpg",
    },
    play: async ({ canvas }) => {
        const image = canvas.getByRole("img")
        const placeholder = canvas.queryByLabelText("placeholder-skeleton")

        await expect(image).toBeInTheDocument()
        await expect(image).toBeVisible()
        await expect(placeholder).not.toBeInTheDocument()
    },
}

export const Loading: Story = {
    args: {
        url: "https://storybook.js.org/images/placeholders/350x150.png",
        isLoading: true,
    },
    play: async ({ canvas }) => {
        const image = canvas.queryByRole("img")
        const placeholder = canvas.getByLabelText("placeholder-skeleton")

        await expect(image).not.toBeInTheDocument()
        await expect(placeholder).toBeInTheDocument()
        await expect(placeholder).toBeVisible()
    },
}

export const WrongUrl: Story = {
    args: {
        url: "fakeUrl",
    },
    play: async ({ canvas }) => {
        const image = canvas.getByRole("img")
        const placeholder = canvas.queryByLabelText("placeholder-skeleton")

        await expect(image).toBeInTheDocument()
        await expect(image).toBeVisible()
        await expect(placeholder).not.toBeInTheDocument()
    },
}

export const CustomPlaceholderStyles: Story = {
    args: {
        url: "fakeUrl",
        isLoading: true,
        skeletonClasses: classes.customPlaceholder,
    },
    play: async ({ canvas }) => {
        const image = canvas.queryByRole("img")
        const placeholder = canvas.getByLabelText("placeholder-skeleton")

        await expect(image).not.toBeInTheDocument()
        await expect(placeholder).toBeInTheDocument()
        await expect(placeholder).toBeVisible()
        await expect(placeholder).toHaveClass(classes.customPlaceholder)
    },
}

export const CustomClassName: Story = {
    args: {
        url: "/grenade-image.jpg",
        className: classes.testClass,
    },
    play: async ({ canvas }) => {
        const image = canvas.getByRole("img")
        const placeholder = canvas.queryByLabelText("placeholder-skeleton")

        await expect(image).toBeInTheDocument()
        await expect(image).toBeVisible()
        await expect(image).toHaveClass(classes.testClass)
        await expect(placeholder).not.toBeInTheDocument()
    },
}
