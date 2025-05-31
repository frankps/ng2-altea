
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
            dayLine = ReportLine.newWithMonth(branchId, ReportPeriod.day, ReportType.v1, year, month, day)
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
        reportOrders.incl = _.sumBy(orders, 'incl')
        reportOrders.excl = _.sumBy(orders, 'excl')

        for (let order of orders) {

            if (order.isEmpty())
                continue

            for (let line of order.lines) {

                let reportProduct = reportOrders.getReportProduct(line.productId, line.descr)
                reportProduct.qty += line.qty
                reportProduct.incl += line.incl
                reportProduct.excl += line.excl

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
}