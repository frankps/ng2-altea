import { Resource } from "../../altea-schema"
import * as _ from "lodash";

/**
 * DateBorders are used to quickly find overlaps in DateRanges (DateRange).
 * A DateBorder typically represents DateRange.from or DateRange.to 
 */
export class DateBorder {

    resourceId = ""
    resource?: Resource

    constructor(public date: Date, public isStart: boolean) {

    }
}

export class DateBorderInfo {

    constructor(public date: Date, public totalOpen = 1, public opened = 0, public closed = 0) {

    }
}


export class DateBorderOverview {

    borders: DateBorderInfo[] = []

    add(borderInfo: DateBorderInfo) {
        this.borders.push(borderInfo)
    }

}


export class DateBorderSet {
    borders: DateBorder[] = []

    constructor(...borders: DateBorder[]) {
        this.borders = borders
    }

    getBorderOverview(): DateBorderOverview {


        const overview = new DateBorderOverview()

        if (!Array.isArray(this.borders))
            return overview

        let totalOpen = 0

        const borderOrdered = _.sortBy(this.borders, ['date', 'isStart'])

        let borderInfo = null

        for (const border of borderOrdered) {

            border.isStart ? totalOpen++ : totalOpen--

            if (borderInfo != null && borderInfo.date == border.date) {
                borderInfo.totalOpen = totalOpen
            } else {
                borderInfo = new DateBorderInfo(border.date, totalOpen)
            }


            if (border.isStart)
                borderInfo.opened++
            else
                borderInfo.closed++

            overview.add(borderInfo)

        }

        return overview
        // this.borders.

    }


}