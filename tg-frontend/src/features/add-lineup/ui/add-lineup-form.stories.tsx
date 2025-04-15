import { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, within } from "@storybook/test"
import { Canvas } from "storybook/internal/types"
import { AddLineupModel } from "../model"
import { AddLineupForm } from "./add-lineup-form"
import classes from "./add-lineup-form.stories.module.scss"

const meta: Meta<typeof AddLineupForm> = {
    component: AddLineupForm,
}

export default meta

type Story = StoryObj<typeof AddLineupForm>

const baseTestData: {
    mocks: AddLineupModel
    baseTestFunction: (canvas: Canvas) => Promise<unknown>
} = {
    mocks: {
        title: "Dust2 A Site Smokes",
        description:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas veniam deserunt nostrum adipisci facilis ex at minus nam illum. Quos, magni odit? Ullam sit molestias quibusdam at placeat est labore nihil ea, quidem adipisci repudiandae eligendi, porro quas numquam. Harum, autem atque excepturi, temporibus omnis quas, nemo similique eligendi.",
        map: "Dust2",
        link_to_video: "https://youtube.com/example-video",
        preview_image_link: null,
    },
    baseTestFunction: async (canvas) => {
        const form = canvas.getByRole("form")

        const titleInput = canvas.getByLabelText(/название лайнапа/i)
        const descriptionInput = canvas.getByLabelText(/описание/i)
        const mapSelect = canvas.getByLabelText(/карта/i)
        const linkInput = canvas.getByLabelText(/ссылка на видео/i)

        await expect(form).toBeInTheDocument()
        await expect(form).toBeVisible()

        await expect(titleInput).toBeInTheDocument()
        await expect(titleInput).toBeVisible()

        await expect(descriptionInput).toBeInTheDocument()
        await expect(descriptionInput).toBeVisible()

        await expect(mapSelect).toBeInTheDocument()
        await expect(mapSelect).toBeVisible()

        await expect(linkInput).toBeInTheDocument()
        await expect(linkInput).toBeVisible()
    },
}

export const Default: Story = {
    args: {
        name: "Default Form",
        className: classes.default,
    },
    play: async ({ canvas }) => {
        await baseTestData.baseTestFunction(canvas)
    },
}

export const Small: Story = {
    args: {
        name: "Small Form",
        className: classes.small,
    },
    play: async ({ canvas }) => {
        const form = canvas.getByRole("form")
        await baseTestData.baseTestFunction(canvas)
        await expect(form).toHaveClass(classes.small)
    },
}

export const Filled: Story = {
    args: {
        name: "Filled Form",
        initialValues: baseTestData.mocks,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)

        const titleInput = canvas.getByLabelText(/название лайнапа/i)
        const descriptionInput = canvas.getByLabelText(/описание/i)
        const mapSelect = canvas.getByLabelText(/карта/i)
        const linkInput = canvas.getByLabelText(/ссылка на видео/i)

        const data = baseTestData.mocks

        await userEvent.type(titleInput, data.title)
        await userEvent.type(descriptionInput, data.description)
        await userEvent.selectOptions(mapSelect, data.map)
        await userEvent.type(linkInput, data.link_to_video)

        await baseTestData.baseTestFunction(canvas)
    },
}
