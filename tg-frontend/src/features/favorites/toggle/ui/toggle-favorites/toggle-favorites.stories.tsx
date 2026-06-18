import { Meta, StoryObj } from "@storybook/react"
import { ToggleFavorites } from "./toggle-favorites"
import {
    testAddInFavorites,
    testErrorAddInFavorites,
    testErrorRemoveFromFavorites,
    testRemoveFromFavorites,
} from "./__tests__/__tests__"
import {
    testFavoritesDeleteErrorServer,
    testFavoritesDeleteServer,
    testFavoritesErrorPostServer,
    testFavoritesPostServer,
} from "./__tests__/__test-servers__"
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
        client.clear()
        await client.prefetchQuery(
            grenadeApi.getGrenadesByIdOptions({
                grenadeId: grenadeDTOmock.grenade_id,
            })
        )
    },
    parameters: {
        layout: "centered",
        msw: {
            handlers: [
                testGrenadeServer({
                    grenadeId: grenadeDTOmock.grenade_id,
                    delayInMs: 0,
                }),
            ],
        },
    },
}

export default meta

type Story = StoryObj<typeof ToggleFavorites>

export const Default: Story = {}

export const AddToFavorites: Story = {
    args: {
        grenadeId: grenadeDTOmock.grenade_id,
    },
    parameters: {
        msw: {
            handlers: [
                testGrenadeServer({
                    grenadeId: grenadeDTOmock.grenade_id,
                    delayInMs: 100,
                    customData: { ...grenadeDTOmock, is_favorite: false },
                }),
                testFavoritesPostServer(),
            ],
        },
    },
    beforeEach: async () => {
        client.clear()
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

export const AddToFavoritesError: Story = {
    args: {
        grenadeId: grenadeDTOmock.grenade_id,
    },
    parameters: {
        msw: {
            handlers: [
                testGrenadeServer({
                    grenadeId: grenadeDTOmock.grenade_id,
                    delayInMs: 100,
                    customData: { ...grenadeDTOmock, is_favorite: false },
                }),
                testFavoritesErrorPostServer(),
            ],
        },
    },
    beforeEach: async () => {
        client.clear()
        await client.prefetchQuery(
            grenadeApi.getGrenadesByIdOptions({
                grenadeId: grenadeDTOmock.grenade_id,
            })
        )
    },
    play: async ({ canvas }) => {
        await testErrorAddInFavorites(canvas)
    },
}

export const RemoveFromFavorites: Story = {
    args: {
        grenadeId: grenadesDTOmock[1].grenade_id,
    },
    parameters: {
        msw: {
            handlers: [
                testGrenadeServer({
                    grenadeId: grenadesDTOmock[1].grenade_id,
                    delayInMs: 100,
                    customData: { ...grenadesDTOmock[1], is_favorite: true },
                }),
                testFavoritesDeleteServer({
                    grenadeId: grenadesDTOmock[1].grenade_id,
                }),
            ],
        },
    },
    beforeEach: async () => {
        client.clear()
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
export const RemoveFromFavoritesError: Story = {
    args: {
        grenadeId: grenadesDTOmock[1].grenade_id,
    },
    parameters: {
        msw: {
            handlers: [
                testGrenadeServer({
                    grenadeId: grenadesDTOmock[1].grenade_id,
                    delayInMs: 100,
                    customData: { ...grenadesDTOmock[1], is_favorite: true },
                }),
                testFavoritesDeleteErrorServer({
                    grenadeId: grenadesDTOmock[1].grenade_id,
                }),
            ],
        },
    },
    beforeEach: async () => {
        client.clear()
        await client.prefetchQuery(
            grenadeApi.getGrenadesByIdOptions({
                grenadeId: grenadesDTOmock[1].grenade_id,
            })
        )
    },
    play: async ({ canvas }) => {
        await testErrorRemoveFromFavorites(canvas)
    },
}
