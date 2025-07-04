
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, ArrayHelper, DateHelper, DbObjectCreate, DbObjectMulti, DbObjectMultiCreate, DbQuery, DbQueryTyped, NumberHelper, ObjectHelper, QueryOperator } from 'ts-common'
import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MsgInfo, OrderLine, Subscription, Product, PriceChangeType, ReportType, ReportPeriod, ReportLine, PaymentType, ReportPayments, ReportOrders, ReportProduct } from 'ts-altea-model'
import { Observable } from 'rxjs'
import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"


export class NgxChartPoint {
    name: string
    value: number

    constructor(name: string | Date | number, value: number) {

        if (name instanceof Date)
            this.name = `${DateHelper.yyyyMMdd(name)}`
        else
            this.name = `${name}`

        this.value = value
    }
}

export class NgxChartLine {
    name: string
    series: NgxChartPoint[] = []

    addPoint(name: string | Date | number, value: number) {
        this.series.push(new NgxChartPoint(name, value))
    }
}

export class NgxChart {
    lines: Map<string, NgxChartLine> = new Map()

    getLine(name: string) {
        let line = this.lines.get(name)

        if (!line) {
            line = new NgxChartLine()
            line.name = name
            this.lines.set(name, line)
        }

        return line
    }


    toArray() {
        return Array.from(this.lines.values())
    }
}


export class ReportOptions {
    cumul: boolean = true
    showNew: boolean = true

    period: ReportPeriod = ReportPeriod.day

    get day(): boolean {
        return this.period == ReportPeriod.day
    }


    get week(): boolean {
        return this.period == ReportPeriod.week
    }

    get month(): boolean {
        return this.period == ReportPeriod.month
    }

    get year(): boolean {
        return this.period == ReportPeriod.year
    }
}

/**
 * Examples: 
 *      https://swimlane.github.io/ngx-charts/#/ngx-charts/bar-horizontal-2d
 * 
 * 
 * 
 * 
 */
export class NgxReportGenerator {

    alteaDb: AlteaDb
    branchId: string
    type: ReportType
    
    reportLines: ReportLine[] = []

    constructor(db: IDb | AlteaDb, branchId: string, type: ReportType) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)

        this.branchId = branchId
        this.type = type
    }

    async loadData(period: ReportPeriod, from: Date, to: Date) {

        this.reportLines = await this.alteaDb.getReportLinesBetween(this.branchId, from, to, this.type, period)
    }

    create(options: ReportOptions): NgxChart {

        let chart = new NgxChart()

        let allPayTypes = [PaymentType.cash, PaymentType.debit, PaymentType.loyal, PaymentType.stripe, PaymentType.subs, PaymentType.gift]

        let cumuls = new Map<string, number>()

        cumuls.set('new', 0)
        cumuls.set('served-excl', 0)
        cumuls.set('served-incl', 0)

        
        if (options.cumul)
            allPayTypes.forEach(payType => cumuls.set(payType, 0))


        for (let reportLine of this.reportLines) {

            if (options.showNew) {
                /** sum of all effective (new)payments => no gifts, subscriptions, etc. (these are previously paid) */
                let payType = 'new'
                let chartLine = chart.getLine(payType)
                let value = reportLine.pays.new
                if (options.cumul) {
                    value = cumuls.get(payType) + value
                    cumuls.set(payType, value)
                }
                chartLine.addPoint(reportLine.date, value)
            }

            if (reportLine.served) {


                let servedExcl = reportLine.served.excl
                let servedIncl = reportLine.served.incl

                if (options.cumul) {
                    servedExcl += cumuls.get('served-excl')
                    cumuls.set('served-excl', servedExcl)
                    servedIncl += cumuls.get('served-incl')
                    cumuls.set('served-incl', servedIncl)
                }


                let servedExclLine = chart.getLine(`served-excl`)
                let servedInclLine = chart.getLine(`served-incl`)

                servedExclLine.addPoint(reportLine.date, servedExcl)
                servedInclLine.addPoint(reportLine.date, servedIncl)


            }


            
  
            if (reportLine.pays?.byType) {

                let byType = reportLine.pays.byType

                let payTypes = Object.keys(byType)

                for (let payType of payTypes) {

                    let value = byType[payType]

                    if (!NumberHelper.isNumber(value)) {
                        continue
                    }
                        

                    let chartLine = chart.getLine(payType)

                    if (options.cumul) {

                        if (!cumuls.has(payType)) {
                            cumuls.set(payType, 0)
                        }

                        value += cumuls.get(payType) //+ value
                        cumuls.set(payType, value)
                    }

                    chartLine.addPoint(reportLine.date, value)
                }

                let missingTypes = allPayTypes.filter(type => !payTypes.includes(type))

                for (let payType of missingTypes) {
                    let chartLine = chart.getLine(payType)

                    let value = 0

                    if (options.cumul) {
                        value = cumuls.get(payType)
                    }

                    chartLine.addPoint(reportLine.date, value)
                }
            }
        }


        return chart

    }

}