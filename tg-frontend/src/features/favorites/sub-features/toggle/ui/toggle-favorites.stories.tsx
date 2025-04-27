import { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent } from "@storybook/test"
import { delay, http, HttpResponse } from "msw"
import { ToggleFavorites } from "./toggle-favorites"
import { BASE_BACKEND_URL } from "@shared/config/constants"
import { grenadeDTOmock, testGrenadeServer } from "@entities/grenade"

const meta: Meta<typeof ToggleFavorites> = {
    component: ToggleFavorites,
    args: {
        grenadeId: grenadeDTOmock.grenade_id,
    },
    parameters: {
        layout: "centered",
        msw: {
            handlers: [
                http.post(`${BASE_BACKEND_URL}/favorites`, async () => {
                    await delay(2000)

                    return new HttpResponse(null, {
                        status: 201,
                    })
                }),
                testGrenadeServer({
                    grenadeId: grenadeDTOmock.grenade_id,
                    delayInMs: 2000,
                    customData: {
                        ...grenadeDTOmock,
                        is_favorite: true,
                    },
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

        await expect(button).not.toBeDisabled()
        await expect(button).toBeEnabled()
    },
}

export default meta

type Story = StoryObj<typeof ToggleFavorites>

export const Default: Story = {}
