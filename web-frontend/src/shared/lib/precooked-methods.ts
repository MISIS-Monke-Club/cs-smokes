import { AxiosResponse } from "axios"
import { ZodError, ZodIssue, ZodSchema } from "zod"

export const typedQuery = <T extends ZodSchema>(
    request: Promise<AxiosResponse>,
    dataSchema: T
): Promise<Zod.infer<typeof dataSchema>> =>
    request.then((response) => {
        try {
            const data = dataSchema.parse(response.data)

            return data
        } catch (err) {
            throw new ZodError(err as ZodIssue[])
        }
    })
