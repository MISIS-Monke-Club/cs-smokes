import { beforeAll } from "vitest"
// 👇 If you're using Next.js, import from @storybook/nextjs
//   If you're using Next.js with Vite, import from @storybook/experimental-nextjs-vite
import { setProjectAnnotations } from "@storybook/react"
// 👇 Import the exported annotations, if any, from the addons you're using; otherwise remove this
import * as previewAnnotations from "./preview"

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
const project = setProjectAnnotations([previewAnnotations])

beforeAll(project.beforeAll)
