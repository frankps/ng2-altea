
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, ArrayHelper, DateHelper, DbObjectCreate, DbObjectMulti, DbObjectMultiCreate, DbQuery, DbQueryTyped, ObjectHelper, QueryOperator } from 'ts-common'
import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MsgInfo, OrderLine, Subscription, Product, PriceChangeType, ReportType, ReportPeriod, ReportLine, PaymentType, ReportPayments, ReportOrders, ReportProduct } from 'ts-altea-model'
import { Observable } from 'rxjs'
import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"

/*

Report 1:
* per(iod)=d(ay)
* type=pay(ments)
* year=
* month=
* day=


*/

export class CreateReportingData {


    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    async createAll() {
        let branchId = '66e77bdb-a5f5-4d3d-99e0-4391bded4c6c'

        let date = new Date()

        let year = date.getFullYear()
        let month = date.getMonth() + 1
        let day = date.getDate()

        await this.createForDay(branchId, year, month, day)
    }

    async createForDays(branchId: string, startDate: Date, endDate: Date) {

        const days: Date[] = dateFns.eachDayOfInterval({
            start: startDate,
            end: endDate
        });

        days.forEach(async day => {

            let res = await this.createForDay(branchId, day.getFullYear(), day.getMonth() + 1, day.getDate())

            console.error(res)

        })
    }

    async createForDay(branchId: string, year: number, month: number, day: number) {

        let reportLines = await this.alteaDb.getReportLinesOn(branchId, ReportPeriod.day, ReportType.v1, year, day, month)

        let dayLine: ReportLine
        let isNew = false

        if (ArrayHelper.NotEmpty(reportLines)) {
            dayLine = reportLines[0]
        } else {
            dayLine = ReportLine.new(branchId, ReportPeriod.day, ReportType.v1, year, month, day)
            isNew = true
        }

        let startDate = new Date(year, month - 1, day)
        let endDate = dateFns.addDays(startDate, 1)

        let startNum = DateHelper.yyyyMMdd000000(startDate)
        let endNum = DateHelper.yyyyMMdd000000(endDate)

        dayLine.pays = await this.createPaymentReportForDay(branchId, startNum, endNum)
        dayLine.served = await this.createOrderReportForDay(branchId, startNum, endNum)

        if (isNew) {
            let createResult = await this.alteaDb.createReportLine(dayLine)
            if (createResult.status == ApiStatus.ok) {
                dayLine = createResult.object
            }
        } else {
            let updateResult = await this.alteaDb.updateReportLine(dayLine)
            if (updateResult.status == ApiStatus.ok) {
                dayLine = updateResult.object
            }
        }
    }


    /** Summarize payments for requested day */
    async createPaymentReportForDay(branchId: string, startNum: number, endNum: number): Promise<ReportPayments> {

        let payments = await this.alteaDb.getPaymentsBetween(branchId, startNum, endNum, null, null, ['order'])

        let reportPayments = new ReportPayments()

        reportPayments.qty = payments.count()
        let payTypes = [PaymentType.stripe, PaymentType.credit, PaymentType.debit, PaymentType.transfer, PaymentType.cash]
        reportPayments.new = payments.totalAmount(payTypes)
        reportPayments.byType = payments.getTotalsByType()

        return reportPayments
    }

    createServedForDay(year: number, month: number, day: number) {

    }


    async createOrderReportForDay(branchId: string, startNum: number, endNum: number): Promise<ReportOrders> {

        let extra = {
            //  contactId: '8fdbf31f-1c6d-459a-b997-963dcd0740d8',
            branchIds: [branchId]
        }

        let orders = await this.alteaDb.getOrdersStartingBetween(startNum, endNum, extra, ['contact', 'lines'])

        let reportOrders = new ReportOrders()

        if (ArrayHelper.IsEmpty(orders))
            return reportOrders

        reportOrders.qty = orders.length
        reportOrders.incl = _.round(_.sumBy(orders, 'incl'), 2)
        reportOrders.excl = _.round(_.sumBy(orders, 'excl'), 2)

        for (let order of orders) {

            if (order.isEmpty())
                continue

            for (let line of order.lines) {

                let reportProduct = reportOrders.getReportProduct(line.productId, line.descr)
                reportProduct.qty += line.qty
                reportProduct.incl = _.round(reportProduct.incl + line.incl, 2)
                reportProduct.excl = _.round(reportProduct.excl + line.excl, 2)

                if (line.hasOptions()) {
                    for (let option of line.options) {
                        let reportOption = reportProduct.getReportOption(option.id, option.name)

                        option.values.forEach(value => {
                            let reportOptionValue = reportOption.getReportOptionValue(value.id, value.name)
                            reportOptionValue.qty++
                        })

                    }
                }
            }
        }

        return reportOrders
    }


    async aggregateAll(branchId: string, startDate: Date, endDate?: Date) {

        if (!endDate)
            endDate = startDate

        let startOfIsoWeek = dateFns.startOfISOWeek(startDate)
        let endOfIsoWeek = dateFns.endOfISOWeek(endDate)

        let startOfMonth = dateFns.startOfMonth(startDate)
        let endOfMonth = dateFns.endOfMonth(endDate)


        let minDate = dateFns.min([startOfIsoWeek, startOfMonth])
        let maxDate = dateFns.max([endOfIsoWeek, endOfMonth])

        // let reportLines = await this.alteaDb.getReportLinesOn(branchId, ReportPeriod.day, ReportType.v1, year, day, month)

        // we load all report data for the given period: day, week, month, ...
        let reportLines = await this.alteaDb.getReportLinesBetween(branchId, minDate, maxDate, ReportType.v1)

        await this.aggregateWeeks(branchId, startOfIsoWeek, endOfIsoWeek, reportLines)

        await this.aggregateMonths(branchId, startOfMonth, endOfMonth, reportLines)

    }

    async aggregateWeeks(branchId: string, startOfIsoWeek: Date, endOfIsoWeek: Date, reportLines: ReportLine[]) {
        const weeks = dateFns.eachWeekOfInterval({
            start: startOfIsoWeek,
            end: endOfIsoWeek
        }, { weekStartsOn: 1 }) // 0 = Sunday, 1 = Monday, etc.)


        weeks.forEach(async (weekStart, index) => {
            const weekEnd = dateFns.endOfWeek(weekStart, { weekStartsOn: 1 });
            // console.log(`Week ${index + 1}: ${weekStart.toDateString()} - ${weekEnd.toDateString()}`);
            const weekNumber = dateFns.getISOWeek(weekStart);
            const yearWeek = weekStart.getFullYear() * 100 + weekNumber

            const weekStartNum = DateHelper.yyyyMMdd(weekStart)
            const weekEndNum = DateHelper.yyyyMMdd(weekEnd)

            let dayLinesInWeek = reportLines.filter(line => line.per == ReportPeriod.day && line.date >= weekStartNum && line.date <= weekEndNum)

            let existingWeek = reportLines.find(line => line.per == ReportPeriod.week && line.date == yearWeek)
            let aggregatedLine = this.aggregateLines(dayLinesInWeek, existingWeek)

            if (!existingWeek) {
                aggregatedLine.setHeader(branchId, ReportPeriod.week, ReportType.v1)
                aggregatedLine.setWeek(weekStart.getFullYear(), weekNumber)
                reportLines.push(aggregatedLine)

                let createResult = await this.alteaDb.createReportLine(aggregatedLine)

                console.error(createResult)
            } else {
                let createResult = await this.alteaDb.updateReportLine(existingWeek)

                console.error(createResult)
            }

        });
    }

    async aggregateMonths(branchId: string, startOfMonth: Date, endOfMonth: Date, reportLines: ReportLine[]) {

        const months = dateFns.eachMonthOfInterval({
            start: startOfMonth,
            end: endOfMonth
        })

        months.forEach(async (monthStart, index) => {
            const monthEnd = dateFns.endOfMonth(monthStart)
            const monthNumber = monthStart.getMonth() + 1
            const yearMonth = monthStart.getFullYear() * 100 + monthNumber

            const monthStartNum = DateHelper.yyyyMMdd(monthStart)
            const monthEndNum = DateHelper.yyyyMMdd(monthEnd)

            let dayLinesInMonth = reportLines.filter(line => line.per == ReportPeriod.day && line.date >= monthStartNum && line.date <= monthEndNum)

            let existingMonth = reportLines.find(line => line.per == ReportPeriod.month && line.date == yearMonth)
            let aggregatedLine = this.aggregateLines(dayLinesInMonth, existingMonth)

            if (!existingMonth) {
                aggregatedLine.setHeader(branchId, ReportPeriod.month, ReportType.v1)
                aggregatedLine.setMonth(monthStart.getFullYear(), monthNumber)
                reportLines.push(aggregatedLine)

                let createResult = await this.alteaDb.createReportLine(aggregatedLine)

                console.error(createResult)
            } else {
                let createResult = await this.alteaDb.updateReportLine(existingMonth)

                console.error(createResult)
            }
        })
    }


    aggregateLines(reportLines: ReportLine[], existingTotal?: ReportLine): ReportLine {

        let result: ReportLine // = new ReportLine()

        if (existingTotal) {
            result = existingTotal
        } else {
            result = new ReportLine()
        }

        let totalPays = new ReportPayments()
        result.pays = totalPays

        let totalServed = new ReportOrders()
        result.served = totalServed

        for (let line of reportLines) {

            if (line.pays) {
                totalPays.qty += line.pays.qty
                totalPays.new += line.pays.new

                if (line.pays.byType) {
                    for (let type in line.pays.byType) {

                        if (!totalPays.byType[type])
                            totalPays.byType[type] = 0

                        totalPays.byType[type] += line.pays.byType[type]
                    }
                }
            }

            if (line.served) {
                totalServed.qty += line.served.qty
                totalServed.incl += line.served.incl
                totalServed.excl += line.served.excl

                if (line.served.prods) {
                    for (let prod of line.served.prods) {
                        let reportProduct = totalServed.getReportProduct(prod.id, prod.name)
                        reportProduct.qty += prod.qty
                        reportProduct.incl = _.round(reportProduct.incl + prod.incl, 2)
                        reportProduct.excl = _.round(reportProduct.excl + prod.excl, 2)
                    }
                }
            }

        }

        return result
    }

}