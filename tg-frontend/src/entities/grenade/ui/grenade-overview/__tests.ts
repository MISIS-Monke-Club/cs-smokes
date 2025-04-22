import { expect } from "@storybook/test"
import { Canvas } from "storybook/internal/types"
import { grenadeModelMock } from "../../model/__mocks"

export const baseTestFunction = async (canvas: Canvas) => {
    const title = canvas.getByRole("heading", { level: 2 })
    const createdBy = canvas.getByTestId("grenade-overview-author")
    const grenadeType = canvas.getByTestId("grenade-overview-grenade-type")
    const previewImage = canvas.getByRole("img")

    await expect(title).toHaveTextContent(
        `Граната с ID: ${grenadeModelMock.grenadeId}`
    )
    await expect(title).toBeInTheDocument()
    await expect(title).toBeVisible()

    await expect(createdBy).toBeInTheDocument()
    await expect(createdBy).toBeVisible()
    await expect(createdBy).toHaveTextContent(
        grenadeModelMock.userId.toString()
    )

    await expect(grenadeType).toBeInTheDocument()
    await expect(grenadeType).toBeVisible()
    await expect(grenadeType).toHaveTextContent(
        grenadeModelMock.typeId.toString()
    )

    await expect(previewImage).toBeInTheDocument()
    await expect(previewImage).toBeVisible()
    await expect(previewImage).toHaveAttribute(
        "src",
        grenadeModelMock.previewImageLink
    )
}

export const oppositeTestFunction = async (canvas: Canvas) => {
    const title = canvas.queryByRole("heading", { level: 2 })
    const createdBy = canvas.queryByTestId("grenade-overview-author")
    const grenadeType = canvas.queryByTestId("grenade-overview-grenade-type")
    const previewImage = canvas.queryByRole("img")

    await expect(title).not.toBeInTheDocument()
    await expect(title).toBeNull()

    await expect(createdBy).not.toBeInTheDocument()
    await expect(createdBy).toBeNull()

    await expect(grenadeType).not.toBeInTheDocument()
    await expect(grenadeType).toBeNull()

    await expect(previewImage).not.toBeInTheDocument()
    await expect(previewImage).toBeNull()
}
