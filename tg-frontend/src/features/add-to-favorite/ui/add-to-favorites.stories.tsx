import { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, waitFor } from "@storybook/test"
import { delay, http, HttpResponse } from "msw"
import { api } from "../api"
import { AddToFavorite } from "./add-to-favorites"
import { BASE_BACKEND_URL } from "@shared/config/constants"

const meta: Meta<typeof AddToFavorite> = {
    component: AddToFavorite,
    parameters: {
        layout: "centered",
        msw: {
            handlers: [
                http.post(`${BASE_BACKEND_URL}/${api.baseUrl}`, async () => {
                    await delay(2000)

                    return new HttpResponse(null, {
                        status: 201,
                    })
                }),
            ],
        },
    },
    play: async ({ canvas }) => {
        const button = canvas.getByRole("button")

        await expect(button).toBeInTheDocument()
        await expect(button).toBeVisible()
        await expect(button).toBeEnabled()

        // Fires request
        await userEvent.click(button)

        await expect(button).toBeDisabled()
        await expect(button).not.toBeEnabled()

        // Enables again
        await waitFor(
            () => {
                expect(button).not.toBeDisabled()
            },
            { timeout: 4000 }
        )
    },
}

export default meta

type Story = StoryObj<typeof AddToFavorite>

export const Default: Story = {}
