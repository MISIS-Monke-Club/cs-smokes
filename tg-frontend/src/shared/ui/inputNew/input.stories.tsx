import { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, within } from "@storybook/test"
import { Input } from "./input"

const meta: Meta<typeof Input> = {
    component: Input,
    parameters: {
        layout: "centered",
    },
    argTypes: {
        type: {
            options: [
                "text",
                "number",
                "email",
                "password",
                "tel",
                "date",
                "textarea",
                "select",
            ],
        },
    },
}

export default meta

type Story = StoryObj<typeof Input>

export const Text: Story = {
    args: {
        withLabel: true,
        label: "Текстовое поле",
        type: "text",
        placeholder: "Введите текст",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const label = canvas.getByText("Текстовое поле")
        const input = canvas.getByPlaceholderText("Введите текст")

        await expect(label).toHaveAttribute("for", "Текстовое поле-input")
        await expect(input).toHaveAttribute("id", "Текстовое поле-input")

        await userEvent.type(input, "testuser")
        await expect(input).toHaveValue("testuser")

        await expect(label).toBeVisible()
        await expect(input).toBeVisible()
    },
}

export const WithLabel: Story = {
    args: {
        withLabel: true,
        label: "Имя пользователя",
        placeholder: "Введите ваше имя",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const label = canvas.getByText("Имя пользователя")
        const input = canvas.getByPlaceholderText("Введите ваше имя")

        await expect(label).toBeInTheDocument()
        await expect(input).toBeInTheDocument()

        await expect(label).toHaveAttribute("for", "Имя пользователя-input")
        await expect(input).toHaveAttribute("id", "Имя пользователя-input")

        await expect(label).toBeVisible()
        await expect(input).toBeVisible()
    },
}

export const Password: Story = {
    args: {
        type: "password",
        withLabel: true,
        label: "Пароль",
        placeholder: "Введите пароль",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const label = canvas.getByText("Пароль")
        const input = canvas.getByPlaceholderText("Введите пароль")

        await expect(label).toBeInTheDocument()
        await expect(input).toBeInTheDocument()

        await expect(label).toHaveAttribute("for", "Пароль-input")
        await expect(input).toHaveAttribute("id", "Пароль-input")

        await expect(label).toBeVisible()
        await expect(input).toBeVisible()
    },
}

export const Email: Story = {
    args: {
        type: "email",
        withLabel: true,
        label: "Email",
        placeholder: "example@mail.com",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const label = canvas.getByText("Email")
        const input = canvas.getByPlaceholderText("example@mail.com")

        await expect(label).toBeInTheDocument()
        await expect(input).toBeInTheDocument()

        await expect(label).toHaveAttribute("for", "Email-input")
        await expect(input).toHaveAttribute("id", "Email-input")

        await expect(label).toBeVisible()
        await expect(input).toBeVisible()
    },
}

export const Textarea: Story = {
    args: {
        type: "textarea",
        withLabel: true,
        label: "Описание",
        placeholder: "Напишите что-нибудь...",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const label = canvas.getByText("Описание")
        const input = canvas.getByPlaceholderText("Напишите что-нибудь...")

        await expect(label).toBeInTheDocument()
        await expect(input).toBeInTheDocument()

        await expect(label).toHaveAttribute("for", "Описание-input")
        await expect(input).toHaveAttribute("id", "Описание-input")

        await expect(label).toBeVisible()
        await expect(input).toBeVisible()
    },
}

export const Select: Story = {
    args: {
        type: "select",
        withLabel: true,
        label: "Выберите вариант",
        options: [
            { value: "option1", label: "Вариант 1" },
            { value: "option2", label: "Вариант 2" },
            { value: "option3", label: "Вариант 3" },
        ],
        placeholder: "Выберите из списка",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const select = canvas.getByLabelText("Выберите вариант")
        const label = canvas.getByText("Выберите вариант")

        await userEvent.selectOptions(select, "option2")
        await expect(select).toHaveValue("option2")

        const option1 = canvas.getByText("Вариант 1")
        await expect(option1).toBeInTheDocument()

        await expect(select).toBeInTheDocument()
        await expect(label).toBeInTheDocument()

        await expect(select).toBeVisible()
        await expect(label).toBeVisible()
    },
}

export const Disabled: Story = {
    args: {
        withLabel: true,
        label: "Неактивное поле",
        placeholder: "Нельзя изменить",
        disabled: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const input = canvas.getByLabelText("Неактивное поле")
        const label = canvas.getByText("Неактивное поле")

        await expect(input).toBeDisabled()
        await userEvent.type(input, "Попытка ввода")
        await expect(input).toHaveValue("")

        await expect(input).toBeInTheDocument()
        await expect(label).toBeInTheDocument()

        await expect(label).toBeVisible()
        await expect(input).toBeVisible()
    },
}

export const Required: Story = {
    args: {
        withLabel: true,
        label: "Обязательное поле",
        placeholder: "Заполните это поле",
        required: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const input = canvas.getByPlaceholderText("Заполните это поле")
        const label = canvas.getByText("Обязательное поле")

        await expect(input).toBeRequired()

        await expect(input).toBeInTheDocument()
        await expect(label).toBeInTheDocument()

        await expect(label).toBeVisible()
        await expect(input).toBeVisible()
    },
}
