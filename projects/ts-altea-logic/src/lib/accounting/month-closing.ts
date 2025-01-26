import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"
import { OrderCheck, OrderCheckItem, OrderCheckItemType } from 'ts-altea-logic'
import { BankTransaction, BankTxType, Order, OrderLine, OrderState, Payment, PaymentInfo, PaymentType, ReportMonth, StripePayout } from 'ts-altea-model'
import { ApiListResult, ApiStatus, ArrayHelper, DateHelper, YearMonth } from 'ts-common'
import * as Rx from "rxjs";



export class MonthClosingResult {

    checks: OrderCheck[] = []
}


export class MonthClosingUpdates {
    orders: Order[] = []
    orderProps: string[] = []
    orderUpdateResult: ApiListResult<Order>

    lines: OrderLine[] = []
    lineProps: string[] = []
    lineUpdateResult: ApiListResult<OrderLine>


    hasOrderUpdates(): boolean {
        return ArrayHelper.NotEmpty(this.orders)
    }

    addOrder(order: Order, ...props: string[]) {
        this.orders.push(order)

        if (props) {
            for (let prop of props) {
                if (this.orderProps.indexOf(prop) == -1)
                    this.orderProps.push(prop)
            }
        }
    }


    hasLineUpdates(): boolean {
        return ArrayHelper.NotEmpty(this.lines)
    }

    addLine(line: OrderLine, ...props: string[]) {
        this.lines.push(line)

        if (props) {
            for (let prop of props) {
                if (this.lineProps.indexOf(prop) == -1)
                    this.lineProps.push(prop)
            }
        }
    }
}


export class MonthClosingUpdate {

    msg: string

    static info(msg: string): MonthClosingUpdate {

        let upd = new MonthClosingUpdate()
        upd.msg = msg

        return upd

    }
}

export class MonthClosing {

    alteaDb: AlteaDb

    inProgress$: Rx.BehaviorSubject<MonthClosingUpdate> = new Rx.BehaviorSubject<MonthClosingUpdate>(null)

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }

    async calculateMonth(branchId: string, yearMonth: YearMonth, closedUntil: YearMonth): Promise<MonthClosingResult> {

        let me = this

        let from = yearMonth.startDate()
        let to = yearMonth.endDate() // dateFns.addDays(from, 1)

        let fromNum = DateHelper.yyyyMMddhhmmss(from)
        let toNum = DateHelper.yyyyMMddhhmmss(to)

        let reportMonth = new ReportMonth(branchId, branchId, yearMonth.y, yearMonth.m)

        let lastId = null
        let take = 50
        let ordersProcessed = 0

        let orders = await me.alteaDb.getOrdersWithPaymentsBetween(from, to, lastId, take)
        console.log(orders)


        let result = new MonthClosingResult()
        let objectsToUpdate = new MonthClosingUpdates()
        let fixIssues = true

        while (ArrayHelper.NotEmpty(orders)) {
            let ordersInBatch = orders.length

            me.inProgress(`Start processing ${ordersInBatch} new orders. (${ordersProcessed} processed) `)

            for (let order of orders) {

                order.sortPayments()
            
                let orderCheck = me.checkOrder(order, objectsToUpdate, fixIssues)   // closedUntil
                result.checks.push(orderCheck)

                me.calculateOrderTaxes(order, objectsToUpdate, closedUntil)

                me.addOrderToMonthReport(order, reportMonth, yearMonth, fromNum, toNum)

                lastId = order.id
            }

            ordersProcessed += ordersInBatch

            await me.updateDatabase(objectsToUpdate)

            if (ordersInBatch == take) {
                orders = await me.alteaDb.getOrdersWithPaymentsBetween(from, to, lastId, take)
                console.log(orders)
            } else {
                let msg = `No more orders (last query retrieved less -${ordersInBatch}- then requested -${take}-)`
                console.log(msg)
                me.inProgress(`Start processing ${ordersInBatch} new orders. (${ordersProcessed} processed) `)
                break
            }
        }

        await me.saveReportMonth(reportMonth)
       // await me.alteaDb.updateReportMonth(reportMonth)

        console.log(orders)

        return result
    }


    async saveReportMonth(reportMonth: ReportMonth) {
        let me = this

        let latestTrue = false
        let latestMonths = await this.alteaDb.getReportMonthsForMonth(reportMonth.branchId, reportMonth.year, reportMonth.month, latestTrue)

        let newVersion = 1

        if (ArrayHelper.NotEmpty(latestMonths)) {
            newVersion = latestMonths[0].version + 1

            for (let rep of latestMonths) {
                rep.latest = false
                rep.act = false
            }

            let res = await this.alteaDb.updateReportMonths(latestMonths, ['latest', 'act'])
            console.log(res)
        }

        reportMonth.latest = true
        reportMonth.version = newVersion

        let createRes = await me.alteaDb.createReportMonth(reportMonth)
        console.log(createRes)

        return reportMonth
    }

    calculateOrder(order: Order) {

        order.calculateVat()

    }


    checkOrder(order: Order, objectsToUpdate: MonthClosingUpdates, fix: boolean = false): OrderCheck {

        let me = this

        let orderCheck = new OrderCheck(order)

        let shouldDeclareTax = me.shouldDeclareTax(order)


        let origTotalPaid = order.paid
        let orderPropsToUpdate = []

        if (origTotalPaid != order.makePayTotals()) {
            orderCheck.add(OrderCheckItemType.paidMismatch, `order.paid db: ${origTotalPaid} <> calculated: ${order.paid}`)

            if (fix) {
                orderPropsToUpdate.push('paid')
            }
        }

        if (order.state != OrderState.cancelled && order.paid > order.incl) {
            orderCheck.add(OrderCheckItemType.paidNotEqualTotal, `order.paid=${order.paid} > order.incl: ${order.incl}`)
        }


        // temp fix (for accident)
        /*
        if (order.giftCode)
            order.gift = true
        else
            order.gift = false
        
        orderPropsToUpdate.push('gift')
        */

        let orderIncl = 0, orderExcl = 0, orderVat = 0
        let skipGiftCheck = false

        if (order.hasLines()) {

            for (let line of order.lines) {
                let linePropsToUpdate = []
                let lineChanged = false

                /** this should be solved as from feb 2025 */
                if (line.descr && line.descr == 'Gift for canceled order') {
                    order.gift = true
                    skipGiftCheck = true
                    orderPropsToUpdate.push('gift')
                }

                if (line.product) {
                    let product = line.product

                    if (!line.cust && line.vatPct != product.vatPct) {
                        orderCheck.add(OrderCheckItemType.lineVatPctMismatch, `line: ${line.vatPct} <> product ${product.vatPct}`)

                        if (fix) {
                            line.vatPct = product.vatPct
                            linePropsToUpdate.push('vatPct')
                            lineChanged = true
                        }
                    }

                    let calculatedIncl = _.round(line.excl + line.vat, 2)
                    let incl = _.round(line.incl, 2)
                    if (calculatedIncl != incl) {
                        orderCheck.add(OrderCheckItemType.lineVatError, `calculated: ${calculatedIncl} <> orderLine.incl ${incl}`)
                    }

                    let calculatedExcl = _.round(line.incl / (1 + line.vatPct / 100), 2)
                    let excl = _.round(line.excl, 2)
                    if (calculatedExcl != excl) {
                        orderCheck.add(OrderCheckItemType.lineExclError, `calculated: ${calculatedExcl} <> orderLine.excl ${excl}`)
                    }


                }

                if (shouldDeclareTax && [6, 12, 21].indexOf(line.vatPct) == -1) {
                    orderCheck.add(OrderCheckItemType.lineVatError, `correct vat%: ${line.vatPct} ?`)
                }

                orderIncl += line.incl
                orderExcl += line.excl
                orderVat += line.vat

                line.calculateInclThenExcl(false)

                if (ArrayHelper.NotEmpty(line.m.f)) { // check if there are updated fields 
                    linePropsToUpdate.push(...line.m.f)
                    lineChanged = true
                }

                if (lineChanged)
                    objectsToUpdate.addLine(line, ...linePropsToUpdate)

            }

        }

        /*
        if (order.hasPayments()) {

            for (let pay of order.payments) {

                switch (pay.type) {

                    case PaymentType.gift:
                        break
                }
            }
        }
            */


        if (order.toInvoice) {

            if (!order.invoiced)
                orderCheck.add(OrderCheckItemType.invoiceProblem, `toInvoice=${order.toInvoice} <> invoiced=${order.invoiced}`)

            if (!order.invoiceId)
                orderCheck.add(OrderCheckItemType.invoiceProblem, `missing invoice (invoiceId is empty)`)

            if (!order.invoiceNum)
                orderCheck.add(OrderCheckItemType.invoiceProblem, `missing invoice number (invoiceNum is empty)`)

        }


        if (!skipGiftCheck) {
            if (order.gift && !order.giftCode) {
                orderCheck.add(OrderCheckItemType.giftProblem, `missing giftCode on gift order`)
            }

            if (!order.gift && order.giftCode) {
                orderCheck.add(OrderCheckItemType.giftProblem, `order has gift code ${order.giftCode}, but not marked as gift`)
            }
        }




        orderIncl = _.round(orderIncl, 2)

        if (orderIncl != order.incl) {
            orderCheck.add(OrderCheckItemType.orderInclMismatch, `calculated: ${orderIncl} <> order.incl ${order.incl}`)
        }

        orderExcl = _.round(orderExcl, 2)

        if (orderExcl != order.excl) {
            orderCheck.add(OrderCheckItemType.orderExclMismatch, `calculated: ${orderExcl} <> order.excl ${order.excl}`)
        }

        orderVat = _.round(orderVat, 2)

        if (orderVat != order.vat) {
            orderCheck.add(OrderCheckItemType.orderVatMismatch, `calculated: ${orderVat} <> order.vat ${order.vat}`)
        }


        if (orderPropsToUpdate.length > 0) {
            orderPropsToUpdate = _.uniq(orderPropsToUpdate)
            objectsToUpdate.addOrder(order, ...orderPropsToUpdate)
        }

        return orderCheck

    }

    calculateOrderTaxes(order: Order, objectsToUpdate: MonthClosingUpdates, closedUntil: YearMonth) {
        let me = this

        let orderChanged = false
        let orderPropsToUpdate = []

        order.calculateVat()

        if (me.shouldDeclareTax(order)) {
            order.calculateTax(closedUntil)
        } else {

            // if it was 
            if (order.tax?.hasLines()) {
                let lastClosedPeriod = closedUntil.toNumber()
                order.tax.lines = order.tax.lines.filter(l => l.per <= lastClosedPeriod)
                order.markAsUpdated('tax')
            }


        }

        if (ArrayHelper.NotEmpty(order.m.f)) { // check if there are updated fields 
            orderPropsToUpdate.push(...order.m.f)
            orderChanged = true
        }

        if (orderChanged)
            objectsToUpdate.addOrder(order, ...orderPropsToUpdate)
    }

    async updateDatabase(objectsToUpdate: MonthClosingUpdates) {

        if (objectsToUpdate.hasLineUpdates()) {

            objectsToUpdate.lineUpdateResult = await this.alteaDb.updateOrderlines(objectsToUpdate.lines, objectsToUpdate.lineProps)
            objectsToUpdate.lines = []

        }


        if (objectsToUpdate.hasOrderUpdates()) {
            objectsToUpdate.orderUpdateResult = await this.alteaDb.updateOrders(objectsToUpdate.orders, objectsToUpdate.orderProps)
            objectsToUpdate.orders = []
        }
    }


    /**
     * Invoiced orders or gift orders are NOT declared
     * @param order 
     * @returns 
     */
    shouldDeclareTax(order: Order): boolean {

        /*
        if (!order || !order.tax || !order.tax.hasLines())
            return false   */

        if (order.invoiced)
            return false

        if (order.gift)
            return false

        return true
    }


    async addOrderToMonthReport(order: Order, month: ReportMonth, yearMonth: YearMonth, from: number, to: number) {

        let paymentsInPeriod = order.payments.filter(p => p.date >= from && p.date < to)

        if (ArrayHelper.NotEmpty(paymentsInPeriod)) {
            let totalPaidInPeriod = _.sumBy(paymentsInPeriod, 'amount')

            month.increaseTotalInc(totalPaidInPeriod)

            for (let pay of paymentsInPeriod) {
                month.increaseInc(pay.type, pay.amount)
            }

            let orderNoDecl = _.sumBy(paymentsInPeriod, 'noDecl')

            if (orderNoDecl)
                month.noDecl = _.round(month.noDecl + orderNoDecl, 2)

        }

        if (this.shouldDeclareTax(order)) {

            let taxInPeriod = order.tax.getLines(yearMonth)

            for (let taxLine of taxInPeriod.lines) {
                month.addTax(taxLine)
            }
        }


    }

    inProgress(msg: string) {
        this.inProgress$.next(MonthClosingUpdate.info(msg))
    }





}