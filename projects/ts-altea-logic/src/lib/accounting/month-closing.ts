import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"
import { BankTransaction, BankTxType, Order, OrderLine, Payment, PaymentInfo, PaymentType, ReportMonth, StripePayout } from 'ts-altea-model'
import { ApiListResult, ApiStatus, ArrayHelper, DateHelper, YearMonth } from 'ts-common'

export enum OrderCheckItemType {

    lineVatPctMismatch = 'lineVatPctMismatch',
    lineVatError = 'lineVatError',
    lineExclError = 'lineExclError',
    orderInclMismatch = 'orderInclMismatch',
    orderExclMismatch = 'orderExclMismatch',
    orderVatMismatch = 'orderVatMismatch'

}

export class OrderCheckItem {

    constructor(public type: OrderCheckItemType,
        public msg: string) {

    }

}

export class OrderCheck {

    items: OrderCheckItem[] = []

    constructor(public order: Order) {

    }

    add(type: OrderCheckItemType, msg: string) {

        let item = new OrderCheckItem(type, msg)
        this.items.push(item)

    }

}

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


export class MonthClosing {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }



    calculateOrder(order: Order) {

        order.calculateVat()

    }


    checkOrder(order: Order, objectsToUpdate: MonthClosingUpdates, closedUntil: YearMonth, fix: boolean = false): OrderCheck {

        let orderCheck = new OrderCheck(order)

        if (ArrayHelper.IsEmpty(order.lines)) {

        }


        let orderIncl = 0, orderExcl = 0, orderVat = 0

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


        let orderChanged = false
        let orderPropsToUpdate = []

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

        order.calculateVat()

        order.calculateTax(closedUntil)

        if (ArrayHelper.NotEmpty(order.m.f)) { // check if there are updated fields 
            orderPropsToUpdate.push(...order.m.f)
            orderChanged = true
        }

        if (fix && orderChanged)
            objectsToUpdate.addOrder(order, ...orderPropsToUpdate)



        return orderCheck

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

    async addOrderToMonthReport(order: Order, month: ReportMonth, yearMonth: YearMonth, from: number, to: number) {

        let paymentsInPeriod = order.payments.filter(p => p.date >= from && p.date < to)

        if (ArrayHelper.NotEmpty(paymentsInPeriod)) {
            let totalPaidInPeriod = _.sumBy(paymentsInPeriod, 'amount')

            month.increaseTotalInc(totalPaidInPeriod)

            for (let pay of paymentsInPeriod) {
                month.increaseInc(pay.type, pay.amount)
            }
        }

        if (order.tax?.hasLines()) {

            let taxInPeriod = order.tax.getLines(yearMonth)

            for (let taxLine of taxInPeriod.lines) {
                month.addTax(taxLine)
            }
        }
    }

    async calculateMonth(branchId: string, yearMonth: YearMonth, closedUntil: YearMonth): Promise<MonthClosingResult> {

        

        let from = yearMonth.startDate()
        let to = dateFns.addDays(from, 1)

        let fromNum = DateHelper.yyyyMMddhhmmss(from)
        let toNum = DateHelper.yyyyMMddhhmmss(to)

        let reportMonth = await this.alteaDb.getReportMonth(branchId, yearMonth.y, yearMonth.m)

        if (!reportMonth) {
            reportMonth = new ReportMonth(branchId, branchId, yearMonth.y, yearMonth.m)

            await this.alteaDb.createReportMonth(reportMonth)
        } 

        reportMonth.reset()


        let lastId = null
        let take = 30
        let ordersProcessed = 0

        let orders = await this.alteaDb.getOrdersWithPaymentsBetween(from, to, lastId, take)
        console.log(orders)

        let result = new MonthClosingResult()
        let objectsToUpdate = new MonthClosingUpdates()
        let fixIssues = true

        while (ArrayHelper.NotEmpty(orders)) {
            let ordersInBatch = orders.length


            for (let order of orders) {

                //        console.log(`${order.id}: ${order.incl}`)
                // this.calculateOrder(order)

                let orderCheck = this.checkOrder(order, objectsToUpdate, closedUntil, fixIssues)
                result.checks.push(orderCheck)

                this.addOrderToMonthReport(order, reportMonth, yearMonth, fromNum, toNum)

                lastId = order.id
            }

            ordersProcessed += ordersInBatch

            await this.updateDatabase(objectsToUpdate)

            if (ordersInBatch == take) {
                orders = await this.alteaDb.getOrdersWithPaymentsBetween(from, to, lastId, take)
                console.log(orders)
            } else {
                console.log(`No more orders (last query retrieved less -${ordersInBatch}- then requested -${take}-)`)
                break
            }


        }



        await this.alteaDb.updateReportMonth(reportMonth)



        console.log(orders)

        return result

    }



}