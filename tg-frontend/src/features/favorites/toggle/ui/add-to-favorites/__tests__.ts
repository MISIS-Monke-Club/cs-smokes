import { expect } from "@storybook/test"
import { Canvas } from "storybook/internal/types"

export const baseTestFunction = async (canvas: Canvas) => {
    const button = canvas.getByTestId("add-to-favorites-button")

    await expect(button).toBeInTheDocument()
    await expect(button).toBeVisible()
    await expect(button).toBeEnabled()
}
