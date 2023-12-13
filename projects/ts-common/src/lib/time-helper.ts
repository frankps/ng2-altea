import * as dateFns from 'date-fns'

export class TimeHelper {

    static hhmmUTC(date: Date = new Date()): string {
        if (date == null)
            throw `Input is null or undefined`

        const hour = ("0" + (date.getUTCHours())).slice(-2)
        const min = ("0" + (date.getUTCMinutes())).slice(-2)

        // const hour = ("0" + (dateFns.getHours(date))).slice(-2)
        // const min = ("0" + (dateFns.getMinutes(date))).slice(-2)

        const res = `${hour}:${min}`

        return res
    }


    static hhmmUTCToDate(hh_mm: string, date: Date = new Date()): Date {
        const items = hh_mm.split(':')

        const hours = items[0]
        const mins = items[1]

        date.setUTCHours(+hours)
        date.setUTCMinutes(+mins)

        const res = new Date(date)  // otherwise UI does not update

        return res
    }


}
