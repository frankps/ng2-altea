import { Exclude, Type, Transform } from "class-transformer";
import 'reflect-metadata'
import { DateHelper, ObjectWithId } from "ts-common";
import * as dateFns from 'date-fns'

export enum ReportPeriod {
    year = 'y',
    quarter = 'q',
    month = 'm',
    week = 'w',
    day = 'd'
}

export enum ReportType {

    v1 = 'v1'

}

export class ReportProductOptionValue {
    id: string
    name: string

    @Type(() => Number)
    qty: number = 0


}


export class ReportProductOption {
    id: string
    name: string

    @Type(() => ReportProductOptionValue)
    values: ReportProductOptionValue[] = []


    getReportOptionValue(id: string, name: string): ReportProductOptionValue {

        let value = this.values.find(v => v.id == id)

        if (!value) {
            value = new ReportProductOptionValue()
            value.id = id
            value.name = name
            this.values.push(value)
        }

        return value
    }
}

export class ReportProduct {

    id: string
    name: string

    @Type(() => Number)
    qty: number = 0

    @Type(() => Number)
    incl: number = 0

    @Type(() => Number)
    excl: number = 0

    @Type(() => ReportProductOption)
    options: ReportProductOption[] = []

    getReportOption(id: string, name: string): ReportProductOption {

        let option = this.options.find(o => o.id == id)

        if (!option) {
            option = new ReportProductOption()
            option.id = id
            option.name = name
            this.options.push(option)
        }

        return option
    }
}

export class ReportOrders {

    @Type(() => Number)
    qty: number = 0

    @Type(() => Number)
    incl: number = 0

    @Type(() => Number)
    excl: number = 0

    @Type(() => ReportProduct)
    prods: ReportProduct[] = []

    getReportProduct(id: string, name: string): ReportProduct {

        let prod = this.prods.find(p => p.id == id)

        if (!prod) {
            prod = new ReportProduct()
            prod.id = id
            prod.name = name
            this.prods.push(prod)
        }

        return prod
    }
}


export class ReportPayments {

    @Type(() => Number)
    qty: number = 0

    /** total of new payments: cash + credit + debit + stripe + transfer (excluding gift, subscription, loyalty) */
    @Type(() => Number)
    new: number = 0

    byType: any = {}
}

export class ReportLine extends ObjectWithId {

    /** Some report lines have no month specified (example: year & quarter reports) */
    static new(branchId: string, per: ReportPeriod, type: ReportType, year: number, month?: number, num?: number): ReportLine {

        let reportLine = new ReportLine()

        reportLine.branchId = branchId
        reportLine.per = per
        reportLine.type = type
        reportLine.year = year
        reportLine.month = month
        reportLine.num = num

        switch (per) {
            case ReportPeriod.day:
                let startOfDay = new Date(year, month - 1, num)

                reportLine.date = DateHelper.yyyyMMdd(startOfDay)
                reportLine.start = DateHelper.yyyyMMdd(startOfDay)

                let endOfDay = dateFns.addDays(startOfDay, 1)
                reportLine.end = DateHelper.yyyyMMdd(endOfDay)
                break
            case ReportPeriod.month:
                reportLine.setMonth(year, month)
                break

            case ReportPeriod.week: {
                reportLine.setWeek(year, num)
                break
            }

            case ReportPeriod.year:
                let startOfYear = new Date(year, 0, 1)
                reportLine.date = year
                reportLine.start = DateHelper.yyyyMMdd(startOfYear)

                let endOfYear = dateFns.addYears(startOfYear, 1)
                reportLine.end = DateHelper.yyyyMMdd(endOfYear)
                break
            case ReportPeriod.quarter:

                let quarterIndex = Math.floor((month - 1) / 3)  // 0-based quarter index

                let startOfQuarter = new Date(year, quarterIndex * 3, 1)
                reportLine.date = year * 100 + quarterIndex + 1
                reportLine.start = DateHelper.yyyyMMdd(startOfQuarter)

                let endOfQuarter = dateFns.addMonths(startOfQuarter, 3)
                reportLine.end = DateHelper.yyyyMMdd(endOfQuarter)
                break
        }

        return reportLine
    }



    constructor() {
        super()
    }

    orgId?: string
    branchId?: string

    /** resource id (in case of data for specific resource, typical staff) */
    resId?: string

    /** period */
    per: ReportPeriod = ReportPeriod.month

    /** to distinguish between purchased and served in period */
    type: ReportType = ReportType.v1

    /** date in yyyyMMdd format for day, yyyyMM for month, yyyyWW for week, ... */
    @Type(() => Number)
    date: number = 0

    //@Type(() => Number)
    year: number = -1

    //@Type(() => Number)
    month?: number

    /** depending on period (.per): day number (1-31), week num (1-52), quarter (1-4) */
    @Type(() => Number)
    num?: number

    /** format: yyyMMdd (including start) */
    @Type(() => Number)
    start: number = 0

    /** format: yyyMMdd (excluding end)*/
    @Type(() => Number)
    end: number = 0

    @Type(() => Number)
    qty: number = 0

    @Type(() => Number)
    incl: number = 0

    @Type(() => Number)
    excl: number = 0


    setHeader(branchId: string, per: ReportPeriod, type: ReportType) {
        this.branchId = branchId
        this.per = per
        this.type = type
    }

    setWeek(year: number, weekNumber: number) {
        this.year = year
        this.num = weekNumber
        this.date = year * 100 + weekNumber

        let startOfWeek = DateHelper.isoWeekToDate(year, weekNumber)

        this.date = year * 100 + weekNumber
        this.start = DateHelper.yyyyMMdd(startOfWeek)

        let endOfWeek = dateFns.addWeeks(startOfWeek, 1)
        this.end = DateHelper.yyyyMMdd(endOfWeek)
    }

    setMonth(year: number, month: number) {
        this.year = year
        this.month = month
        this.date = year * 100 + month

        let startOfMonth = new Date(year, month - 1, 1)

        this.date = DateHelper.yyyyMM(startOfMonth)
        this.start = DateHelper.yyyyMMdd(startOfMonth)

        let endOfMonth = dateFns.addMonths(startOfMonth, 1)
        this.end = DateHelper.yyyyMMdd(endOfMonth)

    }

    /** created orders: orders created in period */
    //@Type(() => ReportOrders)
    created?: ReportOrders

    /** served orders: orders served in period */
    //@Type(() => ReportOrders)
    served?: ReportOrders

    //@Type(() => ReportPayments)
    pays?: ReportPayments

    json?: any

    /** object last updated at */
    //@Type(() => Date)
    public upd: Date = new Date()

    /** object created at */
    //@Type(() => Date)
    public cre: Date = new Date()

}

