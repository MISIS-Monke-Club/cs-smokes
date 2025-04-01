import { AxiosResponse } from "axios"
import { ZodSchema } from "zod"
import { ZodError } from "zod"

type TypedQueryOptions<
    TDto extends object,
    TSchema extends ZodSchema<TDto>,
    TReturn,
> = {
    request: Promise<AxiosResponse>
    dtoSchema: TSchema

    fromDTO: (el: TDto) => TReturn
}

export function typedQuery<
    TDto extends object,
    TSchema extends ZodSchema<TDto>,
    TReturn,
>({
    request,
    dtoSchema,
    fromDTO,
}: TypedQueryOptions<TDto, TSchema, TReturn>): Promise<TReturn> {
    return request.then((response) => {
        try {
            const data: TDto = dtoSchema.parse(response.data)

            const returnData: TReturn = fromDTO(data)

            return returnData
        } catch (err) {
            if (err instanceof ZodError) {
                throw err
            } else {
                throw new Error(
                    `unknown error, recommending to check dtoTransfer function, this error should be unhandled there: ${fromDTO}`
                )
            }
        }
    })
}
