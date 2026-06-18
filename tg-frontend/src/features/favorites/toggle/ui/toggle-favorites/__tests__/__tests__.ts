import { expect, userEvent, waitFor } from "@storybook/test"
import { Canvas } from "storybook/internal/types"

const testAddButtonInDocument = async (canvas: Canvas) => {
    const addButton = canvas.getByTestId("add-to-favorites-button")

    await expect(addButton).toBeInTheDocument()
    await expect(addButton).toBeVisible()
    await expect(addButton).toBeEnabled()

    return addButton
}
const testAddButtonNotInDocument = async (canvas: Canvas) => {
    const addButton = canvas.queryByTestId("add-to-favorites-button")

    await expect(addButton).not.toBeInTheDocument()

    return addButton
}

const testDeleteButtonInDocument = async (canvas: Canvas) => {
    const deleteButton = canvas.getByTestId("delete-from-favorites-button")

    await expect(deleteButton).toBeInTheDocument()
    await expect(deleteButton).toBeVisible()
    await expect(deleteButton).toBeEnabled()

    return deleteButton
}
const testDeleteButtonNotInDocument = async (canvas: Canvas) => {
    const deleteButton = canvas.queryByTestId("delete-from-favorites-button")

    await expect(deleteButton).not.toBeInTheDocument()

    return deleteButton
}

// ---------Story tests below---------

export const testAddInFavorites = async (canvas: Canvas) => {
    const addButton = await testAddButtonInDocument(canvas)

    await userEvent.click(addButton)
    // Optimistic update
    await testDeleteButtonInDocument(canvas)
    await testAddButtonNotInDocument(canvas)
}
export const testErrorAddInFavorites = async (canvas: Canvas) => {
    const addButton = await testAddButtonInDocument(canvas)

    await userEvent.click(addButton)
    // Optimistic update
    await testDeleteButtonInDocument(canvas)
    await testAddButtonNotInDocument(canvas)

    await waitFor(
        async () => {
            // Optimistic update fallen with error and ui reseted
            await testAddButtonInDocument(canvas)
            await testDeleteButtonNotInDocument(canvas)
        },
        {
            timeout: 2000,
        }
    )
}

export const testRemoveFromFavorites = async (canvas: Canvas) => {
    const deleteButton = await testDeleteButtonInDocument(canvas)

    await userEvent.click(deleteButton)
    // Optimistic update
    await testAddButtonInDocument(canvas)
    await testDeleteButtonNotInDocument(canvas)
}
export const testErrorRemoveFromFavorites = async (canvas: Canvas) => {
    const removeButton = await testDeleteButtonInDocument(canvas)

    await userEvent.click(removeButton)
    // Optimistic update
    await testAddButtonInDocument(canvas)
    await testDeleteButtonNotInDocument(canvas)

    await waitFor(
        async () => {
            // Reset of optimistic on error
            await testDeleteButtonInDocument(canvas)
            await testAddButtonNotInDocument(canvas)
        },
        { timeout: 2000 }
    )
}
