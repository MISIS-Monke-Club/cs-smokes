type FormatterOptions = {
    isoDatetime: string
    day?: boolean
    month?: boolean
    draft?: boolean
}

export const dateFormatter = ({
    isoDatetime,
    day,
    month,
    draft = true,
}: FormatterOptions) => {
    const draftTime: string[] = []
    const dateInterface = new Date(isoDatetime)

    if (day || month) {
        draft = false
    }

    if (day) {
        const day = dateInterface.getDate()

        draftTime.push(day.toString())
    }

    if (month) {
        const month = dateInterface.getMonth() + 1

        draftTime.push(month.toString())
    }

    if (draft) {
        return isoDatetime
    }

    return draftTime.join(".")
}
