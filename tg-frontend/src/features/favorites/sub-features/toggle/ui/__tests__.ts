import { expect, userEvent } from "@storybook/test"
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
