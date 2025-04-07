import { queryOptions } from "@tanstack/react-query"
import { AxiosResponse } from "axios"
import { grenadeDTOschema, GrenadeModel } from "../domain"
import { fromGrenadeArrayDTO, fromGrenadeDTO } from "../lib/dto-transformer"
import { mockGrenades } from "./__mocks"
import { typedQuery } from "@shared/lib/precooked-methods"

export const api = {
    baseKey: ["grenade"],
    getGrenades: () =>
        queryOptions<GrenadeModel[]>({
            queryKey: [...api.baseKey, "list"],
            queryFn: () =>
                typedQuery({
                    // request: instance.get("/grenades")
                    // TODO: Remove this mocks
                    request: Promise.resolve({
                        data: mockGrenades,
                        headers: {},
                        request: {},
                        status: 0,
                        statusText: "",
                        config: {} as any,
                    } satisfies AxiosResponse),
                    dtoSchema: grenadeDTOschema.array(),
                    fromDTO: fromGrenadeArrayDTO,
                }),
        }),
    getGrenadeById: ({ grenadeId }: { grenadeId: number }) =>
        queryOptions<GrenadeModel>({
            queryKey: [...api.baseKey, "ById", grenadeId],
            queryFn: () =>
                typedQuery({
                    // request: instance.get(`/grenades/${grenadeId}`),
                    // TODO: remove this mock
                    request: Promise.resolve({
                        data: mockGrenades[grenadeId - 1],
                        headers: {},
                        request: {},
                        status: 0,
                        statusText: "",
                        config: {} as any,
                    } satisfies AxiosResponse),
                    dtoSchema: grenadeDTOschema,
                    fromDTO: fromGrenadeDTO,
                }),
        }),
}
