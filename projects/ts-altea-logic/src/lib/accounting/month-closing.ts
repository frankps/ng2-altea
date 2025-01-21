import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"
import { OrderCheck, OrderCheckItem, OrderCheckItemType } from 'ts-altea-logic'
import { BankTransaction, BankTxType, Order, OrderLine, Payment, PaymentInfo, PaymentType, ReportMonth, StripePayout } from 'ts-altea-model'
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

    static info(msg: string) : MonthClosingUpdate {

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



    calculateOrder(order: Order) {

        order.calculateVat()

    }


    checkOrder(order: Order, objectsToUpdate: MonthClosingUpdates, fix: boolean = false): OrderCheck {

        let orderCheck = new OrderCheck(order)


        let orderIncl = 0, orderExcl = 0, orderVat = 0

        if (order.hasLines()) {

            for (let line of order.lines) {
                let linePropsToUpdate = []
                let lineChanged = false

                if (line.product) {
                    let product = line.product

                    if (line.vatPct != product.vatPct) {
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


        if (order.gift && !order.giftCode) {
            orderCheck.add(OrderCheckItemType.giftProblem, `missing giftCode on gift order`)
        }

        if (!order.gift && order.giftCode) {
            orderCheck.add(OrderCheckItemType.giftProblem, `order has gift code ${order.giftCode}, but not marked as gift`)
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




        return orderCheck

    }

    calculateOrderTaxes(order: Order, objectsToUpdate: MonthClosingUpdates, closedUntil: YearMonth) {
        let orderChanged = false
        let orderPropsToUpdate = []

        order.calculateVat()

        order.calculateTax(closedUntil)

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


    shouldDeclareTax(order: Order): boolean {

        if (!order || !order.tax || !order.tax.hasLines())
            return false

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


    async calculateMonth(branchId: string, yearMonth: YearMonth, closedUntil: YearMonth): Promise<MonthClosingResult> {

        let from = yearMonth.startDate()
        let to = yearMonth.endDate() // dateFns.addDays(from, 1)

        let fromNum = DateHelper.yyyyMMddhhmmss(from)
        let toNum = DateHelper.yyyyMMddhhmmss(to)

        let reportMonth = await this.alteaDb.getReportMonth(branchId, yearMonth.y, yearMonth.m)

        if (!reportMonth) {
            reportMonth = new ReportMonth(branchId, branchId, yearMonth.y, yearMonth.m)

            await this.alteaDb.createReportMonth(reportMonth)
        }

        reportMonth.reset()


        let lastId = null
        let take = 50
        let ordersProcessed = 0

        let orders = await this.alteaDb.getOrdersWithPaymentsBetween(from, to, lastId, take)
        console.log(orders)

        
        

        let result = new MonthClosingResult()
        let objectsToUpdate = new MonthClosingUpdates()
        let fixIssues = true

        while (ArrayHelper.NotEmpty(orders)) {
            let ordersInBatch = orders.length

            this.inProgress(`Start processing ${ordersInBatch} new orders. (${ordersProcessed} processed) `)



            for (let order of orders) {

                //        console.log(`${order.id}: ${order.incl}`)
                // this.calculateOrder(order)

                let orderCheck = this.checkOrder(order, objectsToUpdate, fixIssues)   // closedUntil
                result.checks.push(orderCheck)

                this.calculateOrderTaxes(order, objectsToUpdate, closedUntil)

                this.addOrderToMonthReport(order, reportMonth, yearMonth, fromNum, toNum)


                lastId = order.id
            }

            ordersProcessed += ordersInBatch

            await this.updateDatabase(objectsToUpdate)

            if (ordersInBatch == take) {
                orders = await this.alteaDb.getOrdersWithPaymentsBetween(from, to, lastId, take)
                console.log(orders)
            } else {
                let msg = `No more orders (last query retrieved less -${ordersInBatch}- then requested -${take}-)`
                console.log(msg)
                this.inProgress(`Start processing ${ordersInBatch} new orders. (${ordersProcessed} processed) `)
                break
            }
        }

        await this.alteaDb.updateReportMonth(reportMonth)



        console.log(orders)

        return result

    }



}