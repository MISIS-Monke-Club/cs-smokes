import { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, within } from "@storybook/test"
import { Textarea } from "./textarea"
import classes from "./textarea.stories.module.scss"

const meta: Meta<typeof Textarea> = {
    component: Textarea,
    parameters: {
        layout: "centered",
    },
}

export default meta

type Story = StoryObj<typeof Textarea>

export const Text: Story = {
    args: {
        placeholder: "Введите текст",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const input = canvas.getByPlaceholderText("Введите текст")

        await userEvent.type(input, "testtext")
        await expect(input).toHaveValue("testtext")

        await expect(input).toBeVisible()
    },
}

export const WithLabel: Story = {
    args: {
        withLabel: true,
        label: "Текстовое поле",
        placeholder: "Введите текст",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const label = canvas.getByText("Текстовое поле")
        const input = canvas.getByPlaceholderText("Введите текст")

        await expect(label).toBeInTheDocument()
        await expect(input).toBeInTheDocument()

        await expect(label).toHaveAttribute("for", "Текстовое поле-textarea")
        await expect(input).toHaveAttribute("id", "Текстовое поле-textarea")

        await expect(label).toBeVisible()
        await expect(input).toBeVisible()
    },
}

export const Disabled: Story = {
    args: {
        disabled: true,
        withLabel: true,
        label: "Неактивное поле",
        placeholder: "Введите текст",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const label = canvas.getByText("Неактивное поле")
        const input = canvas.getByPlaceholderText("Введите текст")

        await expect(label).toBeInTheDocument()
        await expect(input).toBeInTheDocument()

        await expect(label).toHaveAttribute("for", "Неактивное поле-textarea")
        await expect(input).toHaveAttribute("id", "Неактивное поле-textarea")

        await expect(label).toBeVisible()
        await expect(input).toBeVisible()

        await expect(input).toBeDisabled()
    },
}

export const Required: Story = {
    args: {
        withLabel: true,
        label: "Обязательное поле",
        placeholder: "Введите текст",
        required: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const input = canvas.getByPlaceholderText("Введите текст")
        const label = canvas.getByText("Обязательное поле")

        await expect(input).toBeRequired()

        await expect(input).toBeInTheDocument()
        await expect(label).toBeInTheDocument()

        await expect(label).toBeVisible()
        await expect(input).toBeVisible()
    },
}

export const CustomClass: Story = {
    args: {
        withLabel: true,
        label: "Пользовательский класс",
        placeholder: "Введите текст",
        textareaClassName: classes.customTextarea,
        labelClassName: classes.customLabel,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const input = canvas.getByPlaceholderText("Введите текст")
        const label = canvas.getByText("Пользовательский класс")

        await expect(input).toBeInTheDocument()
        await expect(label).toBeInTheDocument()

        await expect(label).toBeVisible()
        await expect(input).toBeVisible()

        await expect(label).toHaveClass(classes.customLabel)
        await expect(input).toHaveClass(classes.customTextarea)
    },
}
