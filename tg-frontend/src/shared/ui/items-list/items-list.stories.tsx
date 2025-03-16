import { Meta, StoryObj } from "@storybook/react"
import { expect, within } from "@storybook/test"
import { Skeleton } from "../skeleton"
import { ItemsList } from "./items-list"

// Mock data for component to delete boilerplate
const placeholderElements = {
    elements: [
        <div>element 1</div>,
        <div>element 2</div>,
        <div>element 3</div>,
        <div>element 4</div>,
    ],
    mapFunction: (items: unknown[]) => (
        <>
            {items.map((el, index) => (
                <div
                    key={crypto.randomUUID() + String(index)}
                    aria-label={`list-element-${index}`}
                    style={{ textAlign: "center" }}
                >
                    {el as React.ReactNode}
                </div>
            ))}
        </>
    ),
}

const meta: Meta<typeof ItemsList> = {
    component: ItemsList,
    parameters: {
        layout: "centered",
    },
    args: {
        ...placeholderElements,
        gap: "medium",
        type: "grid",
    },
    decorators: (Story) => (
        <div style={{ minWidth: "100px" }}>
            <Story />
        </div>
    ),
}

export default meta
type Story = StoryObj<typeof ItemsList>

export const Default: Story = {
    args: {
        ...placeholderElements,
    },
    play: async ({ canvas }) => {
        const list = canvas.getByLabelText("items-list")
        const children = list.childNodes

        await expect(list).toBeInTheDocument()
        await expect(list).toBeVisible()

        await expect(children).toHaveLength(4)
    },
}

// TYPE
export const Grid: Story = {
    args: {
        columnsAmount: 2,
    },
    play: async ({ canvas }) => {
        const list = canvas.getByLabelText("items-list")
        const childrenCount = list.childElementCount

        await expect(list).toBeInTheDocument()
        await expect(list).toBeVisible()
        await expect(childrenCount).toBe(4)
    },
}
export const Column: Story = {
    args: {
        ...placeholderElements,
        type: "column",
    },
    play: async ({ canvas }) => {
        const list = canvas.getByLabelText("items-list")

        await expect(list).toBeInTheDocument()
        await expect(list).toBeVisible()
        await expect(list.childElementCount).toEqual(4)
    },
}

// GAP
export const SmallGap: Story = {
    args: {
        ...placeholderElements,
        gap: "small",
    },
    play: async ({ canvas }) => {
        const list = canvas.getByLabelText("items-list")

        await expect(list).toBeInTheDocument()
        await expect(list).toBeVisible()
        await expect(list.childElementCount).toEqual(4)
    },
}
export const MediumGap: Story = {
    args: {
        ...placeholderElements,
        gap: "medium",
    },
    play: async ({ canvas }) => {
        const list = canvas.getByLabelText("items-list")

        await expect(list).toBeInTheDocument()
        await expect(list).toBeVisible()
        await expect(list.childElementCount).toEqual(4)
    },
}
export const LargeGap: Story = {
    args: {
        ...placeholderElements,
        gap: "large",
    },
    play: async ({ canvas }) => {
        const list = canvas.getByLabelText("items-list")

        await expect(list).toBeInTheDocument()
        await expect(list).toBeVisible()
        await expect(list.childElementCount).toEqual(4)
    },
}

export const EmptyList: Story = {
    args: {
        mapFunction: (elements: unknown[]) => <>{elements}</>,
        elements: [],
    },
    play: async ({ canvas }) => {
        const list = canvas.getByLabelText("empty-items-list")
        const text = within(list).getByRole("paragraph")
        const children = list.childNodes

        await expect(list).toBeInTheDocument()
        await expect(list).toBeVisible()

        // Placeholder
        await expect(children.length).toEqual(1)
        await expect(text).toBeInTheDocument()
        await expect(text).toBeVisible()
        await expect(text.textContent).toEqual("No data was provided(")
    },
}

export const Loading: Story = {
    args: {
        isLoading: true,
        loadingItemsLength: 9,
        displayedLoadingItem: (
            <Skeleton widthInPixels={150} heightInPixels={30} />
        ),
    },
    play: async ({ canvas }) => {
        const list = canvas.getByLabelText("empty-items-list")
        const children = within(list).getAllByLabelText("placeholder-skeleton")

        await expect(list).toBeInTheDocument()
        await expect(list).toBeVisible()

        // Placeholders
        await expect(children).not.toBeNull()
        await expect(children).toHaveLength(9)
    },
}
