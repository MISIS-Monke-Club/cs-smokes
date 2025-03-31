import { describe, expect, test } from "vitest"
import { AxiosError, AxiosResponse } from "axios"
import { z, ZodError } from "zod"
import { typedQuery } from "./precooked-methods"

describe("typedQuery", () => {
    test("resolves and returning true value", async () => {
        const dtoSchema = z.object({
            val_1: z.number(),
            val_2: z.string(),
        })
        type dtoModel = { val_1: number; val_2: string }
        type returnModel = { val1: number; val2: string }
        type dtoTransfer = (elements: dtoModel) => returnModel

        const testDTO = {
            val_1: 123,
            val_2: "string",
        }
        const testFromDTO: dtoTransfer = (elements: dtoModel) => ({
            val1: elements.val_1,
            val2: elements.val_2,
        })
        const request: Promise<AxiosResponse> = Promise.resolve({
            data: testDTO,
            headers: {},
            request: {},
            status: 0,
            statusText: "",
            config: {} as any,
        } satisfies AxiosResponse)

        const testReq = typedQuery({
            request,
            dtoSchema,
            fromDTO: testFromDTO,
        })

        await expect(testReq).resolves.toEqual({
            val1: 123,
            val2: "string",
        } satisfies returnModel)
    })
    test("rejects on zod error", async () => {
        const dtoSchema = z.object({
            val_1: z.number(),
            val_2: z.string(),
        })
        type dtoModel = z.infer<typeof dtoSchema>
        type returnModel = { val1: number; val2: string }
        type dtoTransfer = (elements: dtoModel) => returnModel

        const testDTO = {
            val1: 123,
            val_2: "string",
        }
        const testFromDTO: dtoTransfer = (elements: dtoModel) => ({
            val1: elements.val_1,
            val2: elements.val_2,
        })
        const request: Promise<AxiosResponse> = Promise.resolve({
            data: testDTO,
            headers: {},
            request: {},
            status: 0,
            statusText: "",
            config: {} as any,
        } satisfies AxiosResponse)

        const testReq = typedQuery({
            request,
            dtoSchema,
            fromDTO: testFromDTO,
        })

        await expect(testReq).rejects.toBeInstanceOf(ZodError)
    }),
        test("rejects on promise error with axios error", async () => {
            const dtoSchema = z.object({
                val_1: z.number(),
                val_2: z.string(),
            })
            type dtoModel = z.infer<typeof dtoSchema>
            type returnModel = { val1: number; val2: string }
            type dtoTransfer = (elements: dtoModel) => returnModel

            const testFromDTO: dtoTransfer = (elements: dtoModel) => ({
                val1: elements.val_1,
                val2: elements.val_2,
            })
            const request: Promise<AxiosResponse> = Promise.reject(
                new AxiosError("api request failed...")
            )

            const testReq = typedQuery({
                request,
                dtoSchema,
                fromDTO: testFromDTO,
            })

            await expect(testReq).rejects.toBeInstanceOf(AxiosError)
        })
})
