import { ReactNode } from "react"

export type Maper<T extends unknown> = (elements: T[]) => ReactNode
