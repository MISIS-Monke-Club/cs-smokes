import { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, waitFor, within } from "@storybook/test"
import { Canvas } from "storybook/internal/types"
// import { configureStore } from "@reduxjs/toolkit"
// import { Provider } from "react-redux"
import { AddLineupModel } from "../model"
import { AddLineupForm } from "./add-lineup-form"
import classes from "./add-lineup-form.stories.module.scss"
import { mockAddLineup } from "./__mocks"
// import { testAddLineupSuccess } from "./__tests__/__test-servers__"
import { testGrenadeClassesServer } from "@entities/grenade-class//dev"
import { testMapsServer } from "@entities/map/dev"
// import { rootReducer } from "@shared/model"

const meta: Meta<typeof AddLineupForm> = {
    component: AddLineupForm,
    parameters: {
        msw: [testGrenadeClassesServer(), testMapsServer({ delayInMs: 200 })],
    },
}

// const mockStore = configureStore({
//     reducer: rootReducer,
//     preloadedState: {
//         user: {
//             auth: {
//                 userId: 123,
//                 accessToken: "fake-token",
//                 refreshToken: "fake-refresh",
//             },
//             errorMessage: null,
//         },
//     },
// })

// const withStore = (Story: React.ComponentType) => (
//     <Provider store={mockStore}>
//         <Story />
//     </Provider>
// )

export default meta

type Story = StoryObj<typeof AddLineupForm>

const baseTestData: {
    mocks: AddLineupModel
    baseTestFunction: (canvas: Canvas) => Promise<unknown>
} = {
    mocks: mockAddLineup,
    baseTestFunction: async (canvas) => {
        const form = canvas.getByRole("form")

        const titleInput = canvas.getByLabelText(/name/i)
        const descriptionInput = canvas.getByLabelText(/description/i)
        const mapSelect = canvas.getByLabelText(/map/i)
        const grenadeClassSelect = canvas.getByLabelText(/grenade class/i)
        const linkInput = canvas.getByLabelText(/Link to video/i)

        await expect(form).toBeInTheDocument()
        await expect(form).toBeVisible()

        await expect(titleInput).toBeInTheDocument()
        await expect(titleInput).toBeVisible()

        await expect(descriptionInput).toBeInTheDocument()
        await expect(descriptionInput).toBeVisible()

        await expect(mapSelect).toBeInTheDocument()
        await expect(mapSelect).toBeVisible()

        await expect(grenadeClassSelect).toBeInTheDocument()
        await expect(grenadeClassSelect).toBeVisible()

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

export const CustomClassName: Story = {
    args: {
        name: "Custom Class Name",
        className: classes.testClass,
    },
    play: async ({ canvas }) => {
        const form = canvas.getByRole("form")
        await baseTestData.baseTestFunction(canvas)
        await expect(form).toHaveClass(classes.testClass)
    },
}

export const Filled: Story = {
    args: {
        name: "Filled Form",
        initialValues: baseTestData.mocks,
    },
    parameters: {
        msw: [testGrenadeClassesServer(), testMapsServer({ delayInMs: 200 })],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)

        const titleInput = canvas.getByLabelText(/name/i)
        const descriptionInput = canvas.getByLabelText(/description/i)
        const mapSelect = canvas.getByLabelText(/map/i)
        const grenadeClassSelect = canvas.getByLabelText(/grenade class/i)
        const linkInput = canvas.getByLabelText(/Link to video/i)

        const data = baseTestData.mocks

        await userEvent.type(titleInput, data.title)
        await userEvent.type(descriptionInput, data.description)

        await waitFor(() => {
            expect(mapSelect.querySelector("option")).not.toBeNull()
            expect(grenadeClassSelect.querySelector("option")).not.toBeNull()
        })
        await userEvent.selectOptions(mapSelect, "Mirage")
        await userEvent.selectOptions(grenadeClassSelect, "Flashbang")

        await userEvent.type(linkInput, data.link_to_video)

        await baseTestData.baseTestFunction(canvas)
    },
    // }
    // export const SubmitSuccess: Story = {
    //     args: {
    //         name: "Submit Success",
    //         initialValues: baseTestData.mocks,
    //     },
    //     parameters: {
    //         msw: [
    //             testAddLineupSuccess(),
    //             testGrenadeClassesServer(),
    //             testMapsServer({ delayInMs: 100 }),
    //         ],
    //     },
    //     decorators: [withStore],
    //     play: async ({ canvasElement }) => {
    //         const canvas = within(canvasElement)
    //         const data = baseTestData.mocks

    //         const titleInput = canvas.getByLabelText(/name/i)
    //         const descriptionInput = canvas.getByLabelText(/description/i)
    //         const mapSelect = canvas.getByLabelText(/map/i)
    //         const grenadeClassSelect = canvas.getByLabelText(/grenade class/i)
    //         const linkInput = canvas.getByLabelText(/Link to video/i)
    //         const submitButton = canvas.getByRole("button", {
    //             name: /add lineup/i,
    //         })

    //         await waitFor(() => {
    //             expect(mapSelect.querySelector("option")).not.toBeNull()
    //             expect(grenadeClassSelect.querySelector("option")).not.toBeNull()
    //         })

    //         await userEvent.type(titleInput, data.title)
    //         await userEvent.type(descriptionInput, data.description)
    //         await userEvent.selectOptions(mapSelect, data.map)
    //         await userEvent.selectOptions(grenadeClassSelect, "Smoke")
    //         await userEvent.type(linkInput, data.link_to_video)

    //         await userEvent.click(submitButton)

    //         await waitFor(() => {
    //             expect(submitButton).toBeDisabled()
    //             expect(submitButton).toHaveTextContent(/adding.../i)
    //         })
    //     },
}
