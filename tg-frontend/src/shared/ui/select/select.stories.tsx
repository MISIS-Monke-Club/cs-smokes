import { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, within } from "@storybook/test"
import { Select } from "./select"
import classes from "./select.stories.module.scss"

const meta: Meta<typeof Select> = {
    component: Select,
    parameters: {
        layout: "centered",
    },
}

export default meta

type Story = StoryObj<typeof Select>

const defaultOptions = [
    { value: "", label: "Выберите вариант" },
    { value: "option1", label: "Вариант 1" },
    { value: "option2", label: "Вариант 2" },
    { value: "option3", label: "Вариант 3" },
]

export const Default: Story = {
    args: {
        options: defaultOptions,
    },
}

export const WithLabel: Story = {
    args: {
        withLabel: true,
        label: "Выбор опции",
        options: defaultOptions,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const label = canvas.getByText("Выбор опции")
        const select = canvas.getByLabelText("Выбор опции")
        const selectId = label.getAttribute("for")

        await expect(label).toBeInTheDocument()
        await expect(select).toBeInTheDocument()

        await expect(select).toHaveAttribute("id", selectId)
    },
}

export const Disabled: Story = {
    args: {
        withLabel: true,
        label: "Выключенный селект",
        options: defaultOptions,
        disabled: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const select = canvas.getByLabelText("Выключенный селект")

        await expect(select).toBeDisabled()
    },
}

export const Required: Story = {
    args: {
        withLabel: true,
        label: "Обязательный селект",
        options: defaultOptions,
        required: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const select = canvas.getByLabelText("Обязательный селект")

        await expect(select).toBeRequired()
    },
}

export const SelectOption: Story = {
    args: {
        withLabel: true,
        label: "Выберите вариант",
        options: defaultOptions,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const select = canvas.getByLabelText("Выберите вариант")

        await userEvent.selectOptions(select, "option2")
        await expect(select).toHaveValue("option2")
    },
}

export const CustomClass: Story = {
    args: {
        withLabel: true,
        label: "Селект с кастомным классом",
        options: defaultOptions,
        selectClassName: classes.customSelect,
        labelClassName: classes.customLabel,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const select = canvas.getByLabelText("Селект с кастомным классом")
        const label = canvas.getByText("Селект с кастомным классом")

        await expect(select).toHaveClass(classes.customSelect)
        await expect(label).toHaveClass(classes.customLabel)
    },
}
