type PatchCheckerOptions<T> = {
    originValue?: T
    changedValue?: Partial<T>
    modifyData?: boolean
}

type PatchCheckerReturnType<T> = {
    isChanged: boolean
    modifiedData: Partial<T> | null
}

/**
 * @description Checks differences between original and modified value
 * also returns flag which indicates changes
 *
 * @param options options for this function
 * @param options.originValue data before modification
 * @param options.changedValue modified data, that needs to be checked
 * @param options.modifyData true - will return spread object, false - will return null in modifiedData
 *
 * @example
 * const result = patchChecker({
 *   originValue: { name: "Alice", age: 30 },
 *   changedValue: { name: "Alice", age: 31 },
 *   modifyData: true,
 * });
 * console.log(result.isChanged); // true
 * console.log(result.modifiedData); // { age: 31 }
 */
export const patchChecker = <T>({
    originValue = undefined,
    changedValue = undefined,
    modifyData = false,
}: PatchCheckerOptions<T>): PatchCheckerReturnType<T> => {
    const modifiedVersion: Partial<T> = {}
    let isChanged: boolean = false

    if (!originValue || !changedValue) {
        return {
            isChanged: false,
            modifiedData: {},
        }
    }

    for (const key in changedValue) {
        // New value detected
        if (changedValue[key] !== originValue[key]) {
            isChanged = true

            if (modifyData) {
                modifiedVersion[key] = changedValue[key]
            }
        }
        // Origin data equals to the new data
        else {
            // Setting undefined to make this field invisible for PATCH request
            modifiedVersion[key] = undefined
        }
    }

    return {
        isChanged: isChanged,
        modifiedData: modifyData ? modifiedVersion : null,
    }
}
