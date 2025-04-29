import { Meta, StoryObj } from "@storybook/react"
import { delay, http, HttpResponse } from "msw"
import { ToggleFavorites } from "./toggle-favorites"
import {
    baseTestFunction,
    testAddInFavorites,
    testRemoveFromFavorites,
} from "./__tests__"
import { BASE_BACKEND_URL } from "@shared/config/constants"
import {
    grenadeDTOmock,
    grenadesDTOmock,
    testGrenadeServer,
} from "@entities/grenade/dev"
import { client } from "@shared/api"
import { grenadeApi } from "@entities/grenade"

const meta: Meta<typeof ToggleFavorites> = {
    component: ToggleFavorites,
    args: {
        grenadeId: grenadeDTOmock.grenade_id,
    },
    beforeEach: async () => {
        await client.prefetchQuery(
            grenadeApi.getGrenadesByIdOptions({
                grenadeId: grenadeDTOmock.grenade_id,
            })
        )
    },
    parameters: {
        layout: "centered",
        reactQueryDevTools: true,
        msw: {
            handlers: [
                http.post(`${BASE_BACKEND_URL}/favorites`, async () => {
                    await delay(2000)

                    return new HttpResponse(null, {
                        status: 201,
                    })
                }),
                http.delete(
                    `${BASE_BACKEND_URL}/favorites/${grenadesDTOmock[1].grenade_id}`,
                    async () => {
                        await delay(2000)

                        return new HttpResponse(null, {
                            status: 201,
                        })
                    }
                ),
                testGrenadeServer({
                    grenadeId: grenadeDTOmock.grenade_id,
                    delayInMs: 200,
                    customData: {
                        ...grenadeDTOmock,
                        is_favorite: false,
                    },
                }),
                testGrenadeServer({
                    grenadeId: grenadesDTOmock[1].grenade_id,
                    delayInMs: 200,
                    customData: {
                        ...grenadeDTOmock,
                        is_favorite: true,
                    },
                }),
            ],
        },
    },
    play: async ({ canvas }) => {
        await baseTestFunction(canvas)
    },
}

export default meta

type Story = StoryObj<typeof ToggleFavorites>

export const Default: Story = {}

export const AddToFavorites: Story = {
    args: {
        grenadeId: grenadeDTOmock.grenade_id,
    },
    beforeEach: async () => {
        await client.prefetchQuery(
            grenadeApi.getGrenadesByIdOptions({
                grenadeId: grenadeDTOmock.grenade_id,
            })
        )
    },
    play: async ({ canvas }) => {
        await testAddInFavorites(canvas)
    },
}

export const RemoveFromFavorites: Story = {
    args: {
        grenadeId: grenadesDTOmock[1].grenade_id,
    },
    beforeEach: async () => {
        await client.prefetchQuery(
            grenadeApi.getGrenadesByIdOptions({
                grenadeId: grenadesDTOmock[1].grenade_id,
            })
        )
    },
    play: async ({ canvas }) => {
        await testRemoveFromFavorites(canvas)
    },
}
