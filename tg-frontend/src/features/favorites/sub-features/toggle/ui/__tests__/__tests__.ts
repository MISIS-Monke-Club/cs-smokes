import { expect, userEvent, waitFor } from "@storybook/test"
import { Canvas } from "storybook/internal/types"

export const baseTestFunction = async (canvas: Canvas) => {
    const button = canvas.getByTestId("favorites-toggle-button")

    await expect(button).toBeInTheDocument()
    await expect(button).toBeVisible()
    await expect(button).toBeEnabled()
}

export const testAddInFavorites = async (canvas: Canvas) => {
    const button = canvas.getByTestId("favorites-toggle-button")

    await expect(button).toBeInTheDocument()
    await expect(button).toBeVisible()
    await expect(button).toBeEnabled()

    await expect(button).toHaveAttribute("data-status", "not-in-favorite")
    await userEvent.click(button)

    await expect(button).toHaveAttribute("data-status", "in-favorites")
    await expect(button).toBeInTheDocument()
    await expect(button).toBeVisible()
    await expect(button).toBeEnabled()
}
export const testErrorAddInFavorites = async (canvas: Canvas) => {
    const button = canvas.getByTestId("favorites-toggle-button")

    await expect(button).toBeInTheDocument()
    await expect(button).toBeVisible()
    await expect(button).toBeEnabled()

    await expect(button).toHaveAttribute("data-status", "not-in-favorite")
    await userEvent.click(button)

    // Optimistic update
    await expect(button).toHaveAttribute("data-status", "in-favorites")

    // Reset of optimistic on error
    waitFor(
        async () => {
            await expect(button).toHaveAttribute(
                "data-status",
                "not-in-favorite"
            )
            await expect(button).toBeInTheDocument()
            await expect(button).toBeVisible()
            await expect(button).toBeEnabled()
        },
        { timeout: 2000 }
    )
}

export const testRemoveFromFavorites = async (canvas: Canvas) => {
    const button = canvas.getByTestId("favorites-toggle-button")

    await expect(button).toBeInTheDocument()
    await expect(button).toBeVisible()
    await expect(button).toBeEnabled()

    await expect(button).toHaveAttribute("data-status", "in-favorites")
    await userEvent.click(button)

    await expect(button).toHaveAttribute("data-status", "not-in-favorite")
    await expect(button).toBeInTheDocument()
    await expect(button).toBeVisible()
    await expect(button).toBeEnabled()
}
export const testErrorRemoveFromFavorites = async (canvas: Canvas) => {
    const button = canvas.getByTestId("favorites-toggle-button")

    await expect(button).toBeInTheDocument()
    await expect(button).toBeVisible()
    await expect(button).toBeEnabled()

    await expect(button).toHaveAttribute("data-status", "in-favorites")
    await userEvent.click(button)

    // Optimistic update
    await expect(button).toHaveAttribute("data-status", "not-in-favorite")

    waitFor(
        async () => {
            // Reset of optimistic on error
            await expect(button).toHaveAttribute("data-status", "in-favorites")
            await expect(button).toBeInTheDocument()
            await expect(button).toBeVisible()
            await expect(button).toBeEnabled()
        },
        { timeout: 2000 }
    )
}
