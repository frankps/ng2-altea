import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"
import { BankTransaction, BankTxType, Branch, Invoice, Order, Payment, PaymentInfo, Payments, PaymentType, StripePayout } from 'ts-altea-model'
import { ApiStatus, ArrayHelper, DateHelper, TypeHelper, YearMonth } from 'ts-common'


export class BankTransactionCheckResult {

  ok: boolean = false
  tx: BankTransaction
  msg?: string

  constructor(ok: boolean, tx: BankTransaction, msg?: string) {

    this.ok = ok
    this.tx = tx
    this.msg = msg

  }

  static notOk(tx: BankTransaction, msg?: string): BankTransactionCheckResult {
    let res = new BankTransactionCheckResult(false, tx, msg)

    return res

  }

  static ok(tx: BankTransaction, msg?: string): BankTransactionCheckResult {
    let res = new BankTransactionCheckResult(true, tx, msg)

    return res

  }

}

export class CheckResult {

  constructor(public msg: string, public order?: Order) {

  }

}

export class CheckResults {

  results: CheckResult[] = []

  addMsg(msg: string, order?: Order): CheckResults {
    this.results.push(new CheckResult(msg, order))

    return this
  }


}



export class ConsistencyReportBank {

  count = {
    ok: 0,
    errors: 0
  }

  errors: BankTransactionCheckResult[] = []

}


export class ConsistencyReport {

  cash: CheckResults

  invoices: CheckResults

  gifts: CheckResults

  bank: ConsistencyReportBank

  paysNotLinkedToBank: Payments
}


export class MonthConsistencyReportBuilder {

  alteaDb: AlteaDb

  constructor(public branchId, db: IDb | AlteaDb) {

    if (db instanceof AlteaDb)
      this.alteaDb = db
    else
      this.alteaDb = new AlteaDb(db)
  }


  async checkAll(branch: Branch, yearMonth: YearMonth, calculateNoDecl: boolean, resetNoDecl: boolean, fixToInvoice: boolean): Promise<ConsistencyReport> {


    let me = this
    let report = new ConsistencyReport()

    console.warn('checkAll')


    let closed = branch.acc.closed

    if (yearMonth.y > closed.year || (yearMonth.y == closed.year && yearMonth.m > closed.month))
      report.cash = await me.cashPayments(yearMonth, calculateNoDecl, resetNoDecl)

    report.invoices = await me.invoiceChecks(yearMonth, fixToInvoice)

    report.gifts = await me.giftChecks(yearMonth)

    report.bank = await me.checkTransactions(yearMonth)

    report.paysNotLinkedToBank = await me.checkPayments(yearMonth)

    return report
  }

  orderHealthCheck(order: Order) {



  }



  async cashPayments(yearMonth: YearMonth, calculateNoDecl: boolean, resetNoDecl: boolean): Promise<CheckResults> {

    let me = this

    let result = new CheckResults()

    let start = yearMonth.startDate()

    // let end = dateFns.addDays(start, 10)
    let end = dateFns.addMonths(start, 1)  // yearMonth.endDate()

    let startNum = DateHelper.yyyyMMddhhmmss(start)
    let endNum = DateHelper.yyyyMMddhhmmss(end)

    let orders = await this.alteaDb.getOrdersWithPaymentsBetween(start, end, null, 1000, [PaymentType.cash])

    if (ArrayHelper.IsEmpty(orders))
      return result.addMsg('No cash orders found!')

    let minValue = 0

    // without cash returns
    let totalPositivePays = me.getTotal(orders, PaymentType.cash, startNum, endNum, minValue)

    let totalsInclCashReturns = me.getTotal(orders, PaymentType.cash, startNum, endNum, -100000)

    let totals = {
      noDeclare: 0, ids: []
    }


    let paysToUpdate = []

    let max = totalsInclCashReturns / 2



    //return result.addMsg(`Max cash payments (/2)= ${max}`)
    if (resetNoDecl) {
      for (let order of orders) {
        me.resetNoDecl(order, startNum, endNum, paysToUpdate)
      }
    }

    if (calculateNoDecl) {


      for (let order of orders) {

        me.doOrderCash(order, startNum, endNum, paysToUpdate, result, { fullCashOnly: true, min: 30 }, totals)

        if (totals.noDeclare > max)
          break
      }

      //max = 1600

      if (totals.noDeclare < max) {

        for (let order of orders) {

          me.doOrderCash(order, startNum, endNum, paysToUpdate, result, { fullCashOnly: false, min: 30 }, totals)

          if (totals.noDeclare > max)
            break
        }

      }

      result.addMsg(`Total cash positive pays: ${totalPositivePays}, total incl negative pays=${totalsInclCashReturns}`)
      result.addMsg(`No declare: ${totals.noDeclare}, max noDecl=${max} (stop when noDeclare > max)`)

    }

    if (ArrayHelper.NotEmpty(paysToUpdate)) {
      var payUpdateRes = await this.alteaDb.updatePayments(paysToUpdate, ['noDecl'])

      console.log(payUpdateRes)
      console.log(orders)
      console.log(totals.noDeclare)
    }


    return result
  }


  async orderHealthChecks(yearMonth: YearMonth) {

    let from = yearMonth.startDate()
    let to = yearMonth.endDate() // dateFns.addDays(from, 1)

    let lastId = null
    let take = 50
    let ordersProcessed = 0

    let orders = await this.alteaDb.getOrdersWithPaymentsBetween(from, to, lastId, take)

    while (ArrayHelper.NotEmpty(orders)) {
      let ordersInBatch = orders.length




      if (ordersInBatch == take) {
        orders = await this.alteaDb.getOrdersWithPaymentsBetween(from, to, lastId, take)
        console.log(orders)
      } else {
        let msg = `No more orders (last query retrieved less -${ordersInBatch}- then requested -${take}-)`
        console.log(msg)
        // this.inProgress(`Start processing ${ordersInBatch} new orders. (${ordersProcessed} processed) `)
        break
      }
    }

  }


  filterOrdersWithPaymentsBetween(orders: Order[], start: number | Date, end: number | Date) : Order[] {

    if (ArrayHelper.IsEmpty(orders))
      return []

    let startNum: number
    let endNum: number

    if (TypeHelper.isDate(start))
        startNum = DateHelper.yyyyMMddhhmmss(start as Date)
    else
        startNum = start as number

    if (TypeHelper.isDate(end))
        endNum = DateHelper.yyyyMMddhhmmss(end as Date)
    else
        endNum = end as number



    let filteredOrders = orders.filter(o => o.payments && o.payments.some(p => p.date >= startNum && p.date < endNum))

    return filteredOrders

  }

  /**
   * 
   * @param yearMonth 
   * @param fixToInvoice sometimes invoice was requested, but finally not needed
   * @returns 
   */
  async invoiceChecks(yearMonth: YearMonth, fixToInvoice: boolean): Promise<CheckResults> {


    let result = new CheckResults()


    let yearMonthNum = yearMonth.toNumber()

    let start = yearMonth.startDate()
    let end = yearMonth.endDate()


    /** all orders invoiced? */

    let ordersInvoiceProblem = await this.alteaDb.getOrdersMissingInvoice(this.branchId, start)
    ordersInvoiceProblem = this.filterOrdersWithPaymentsBetween(ordersInvoiceProblem, start, end)

    if (ArrayHelper.NotEmpty(ordersInvoiceProblem)) {

      result.addMsg(`${ordersInvoiceProblem.length} orders with invoice problem, trying to solve...`)

      let ordersToUpdate: Order[] = []

      for (let order of ordersInvoiceProblem) {

        let orderInvoiceOk = false

        let extraInfo = 'invoice problem'

        if (order.invoiceId && order.invoice) {

          let invoice = order.invoice
          let invoiceIncl = invoice.totals.incl

          let numOfOrders = 0

          let ordersIncl = -1

          if (ArrayHelper.NotEmpty(invoice.orders)) {
            ordersIncl = _.sumBy(invoice.orders, 'incl')
            numOfOrders = invoice.orders.length

          }

          if (ordersIncl == invoiceIncl) {
            orderInvoiceOk = true
          } else {
            extraInfo = `invoice total ${invoiceIncl} != order total ${ordersIncl}`

            if (numOfOrders > 1) {
              extraInfo += ` (${numOfOrders} orders in invoice)`
            }
          }




          if (orderInvoiceOk) {
            order.invoiced = true
            order.invoiceNum = order.invoice.num

            ordersToUpdate.push(order)
          }
        } else {
          extraInfo = 'no invoice'

          if (fixToInvoice) {
            order.toInvoice = false
            ordersToUpdate.push(order)
          }

        }

        if (!orderInvoiceOk) {

          let createdAt = dateFns.format(order.cre, 'dd/MM/yy')
          result.addMsg(`${order.for} created at ${createdAt} has ${extraInfo}...`, order)

        }


      }

      if (ArrayHelper.NotEmpty(ordersToUpdate)) {
        let updateRes = await this.alteaDb.updateOrders(ordersToUpdate, ['toInvoice', 'invoiced', 'invoiceNum'])

        if (updateRes.isOk)
          result.addMsg(`${ordersToUpdate.length} orders updated...`)
      }

    }




    /** GIFTS needing invoice */

    let gifts = await this.alteaDb.getGiftsToInvoice(start, end)

    result.addMsg(`${gifts.length} gifts found needing invoice in ${yearMonthNum}`)

    let orderIds = gifts.filter(g => g.orderId).map(g => g.orderId)

    result.addMsg(`${orderIds.length} corresponding orders found`)

    let orders = await this.alteaDb.getOrdersByIds(orderIds)

    for (let gift of gifts) {
      let order = orders.find(o => o.id == gift.orderId)

      if (!order) {
        result.addMsg(`no order found for gift ${gift.code}`)
        continue
      }

      if (!order.toInvoice || !order.invoiced) {
        result.addMsg(`corresponding order for '${gift.code}' invoiced? toInvoice=${order.toInvoice} invoiced=${order.invoiced} invoiceNum=${order.invoiceNum}`, order)
      }

    }

    return result

  }

  /**
   * We need to make sure that the decalred flag of a gift is set, when the original gift purchase order was invoiced!
   * 
   * @param yearMonth 
   * @returns 
   */
  async giftChecks(yearMonth: YearMonth): Promise<CheckResults> {


    let yearMonthNum = yearMonth.toNumber()

    let result = new CheckResults()

    let start = yearMonth.startDate()
    let end = dateFns.addMonths(start, 1)

    let giftPays = await this.alteaDb.getPaymentsBetween(this.branchId, start, end, [PaymentType.gift], true, ['gift'])

    if (!giftPays || !giftPays.hasPayments())
      return result.addMsg(`No gift payments in period ${yearMonthNum}`)

    result.addMsg(`${giftPays.list.length} gift payments found in period ${yearMonthNum}`)

    let orderIds = giftPays.getGiftOrderIds()

    if (ArrayHelper.IsEmpty(orderIds))
      return result.addMsg('No gift purchase order ids found!')

    result.addMsg(`${orderIds.length} gift purchase order ids found`)

    let orders = await this.alteaDb.getOrdersByIds(orderIds)

    if (ArrayHelper.IsEmpty(orders))
      return result.addMsg('No orders found!')

    result.addMsg(`${orders.length} gift purchase orders found`)

    let invoicedOrders = orders.filter(o => o.invoiced)

    if (ArrayHelper.IsEmpty(invoicedOrders))
      return result.addMsg('No invoiced orders found!')

    result.addMsg(`${invoicedOrders.length} gift purchase orders found that are invoiced`)

    let gifts = giftPays.getGifts()

    let giftsToUpdate = []

    for (let order of invoicedOrders) {

      let gift = gifts.find(g => g.orderId == order.id)

      if (!gift) {
        result.addMsg(`Error: gift not found where gift.orderId='{order.id}'`)
        continue
      }

      if (!gift.decl || !gift.invoice) {
        gift.decl = true
        gift.invoice = true

        giftsToUpdate.push(gift)
      }
    }

    if (ArrayHelper.IsEmpty(giftsToUpdate)) {

      return result.addMsg('No gifts to update!')

    } else {

      result.addMsg(`${giftsToUpdate.length} gifts to update (properties: decl=true, invoice=true)`)
      var updateResult = await this.alteaDb.updateGifts(giftsToUpdate, ['decl', 'invoice'])

      result.addMsg(`Gift update: ${updateResult.status}`)

    }

    return result
  }


  resetNoDecl(order: Order, startNum: number, endNum: number, paysToUpdate: Payment[]) {

    let cashPays = order.getPaymentsBetween(startNum, endNum, [PaymentType.cash])

    let cashPaysNoDecl = cashPays.filter(p => p.noDecl > 0)

    // reset the NoDecl
    if (ArrayHelper.NotEmpty(cashPaysNoDecl)) {

      for (let pay of cashPaysNoDecl) {
        pay.noDecl = 0

        if (paysToUpdate.findIndex(p => p.id == pay.id) == -1) // if not yet in the list
          paysToUpdate.push(pay)
      }
    }
  }


  doOrderCash(order: Order, startNum: number, endNum: number, paysToUpdate: Payment[], result: CheckResults, mode: { fullCashOnly: boolean, min: number }, totals: { noDeclare: number, ids: string[] }) {
    if (order.toInvoice || order.invoiced || order.gift || order.giftCode)
      return

    let cashPays = order.getPaymentsBetween(startNum, endNum, [PaymentType.cash])

    /*
    let cashPaysNoDecl = cashPays.filter(p => p.noDecl > 0)

    if (ArrayHelper.NotEmpty(cashPaysNoDecl)) {

      for (let pay of cashPaysNoDecl) {
        pay.noDecl = 0

        if (paysToUpdate.findIndex(p => p.id == pay.id) == -1) // if not yet in the list
          paysToUpdate.push(pay)
      }
    }*/


    if (ArrayHelper.IsEmpty(cashPays))
      return

    /* We might call this method 2 times, once to try all cash, second a partial try
    */
    if (!totals.ids.includes(order.id)) {
      let noDeclTotal = _.sumBy(cashPays, 'noDecl')  // already done before
      totals.noDeclare += noDeclTotal
      totals.ids.push(order.id)
    } else {
      console.log(`already added order ${order.id}`)
    }

    cashPays = cashPays.filter(p => p.amount > mode.min && p.noDecl == 0)

    if (ArrayHelper.IsEmpty(cashPays))
      return

    let totalPays = order.nrOfPayments()
    let numOfCashPays = cashPays.length
    let totalCashPays = _.sumBy(cashPays, 'amount')

    let startDateNum = order.start

    /** Only cash used and order serviced with period  */
    if ((!mode.fullCashOnly || numOfCashPays == totalPays) && startDateNum && startDateNum >= startNum && startDateNum < endNum) {
      let paysToReduce = cashPays
      for (let pay of paysToReduce) {
        pay.noDecl = pay.amount

        if (paysToUpdate.findIndex(p => p.id == pay.id) == -1) // if not yet in the list
          paysToUpdate.push(pay)


        totals.noDeclare += pay.noDecl

        result.addMsg(`noDecl ${pay.noDecl} @ ${pay.date} for ${order.for} (${totals.noDeclare})`, order)
      }
    }
  }


  getTotal(orders: Order[], payType: PaymentType, startNum: number, endNum: number, minValue): number {

    if (ArrayHelper.IsEmpty(orders))
      return 0

    let total = 0

    let pays = orders.flatMap(o => o.payments)

    pays = pays.filter(p => p && p.type == payType && p.date >= startNum && p.date < endNum && p.amount > minValue)

    total = _.sumBy(pays, 'amount')

    return total
  }



  async checkPayments(yearMonth: YearMonth): Promise<Payments> {

    let start = yearMonth.startDate()
    let end = dateFns.addMonths(start, 1)  // yearMonth.endDate()

    let pays = await this.alteaDb.getPaymentsBetween(this.branchId, start, end, [PaymentType.credit, PaymentType.debit, PaymentType.stripe, PaymentType.transfer], true, ['order'])

    return pays

  }

  checkTransaction(tx: BankTransaction): BankTransactionCheckResult {

    if (!tx)
      return BankTransactionCheckResult.notOk(tx)

    let totalPayments = 0
    let nrOfPayments = 0

    if (ArrayHelper.NotEmpty(tx.payments)) {
      totalPayments = _.sumBy(tx.payments, 'amount')
      nrOfPayments = tx.payments.length
    }

    let expectedTotal = tx.cost != 0 ? tx.orig : tx.amount

    expectedTotal = _.round(expectedTotal, 2)
    totalPayments = _.round(totalPayments, 2)

    if (expectedTotal == totalPayments) {

      return BankTransactionCheckResult.ok(tx)

    } else {

      return BankTransactionCheckResult.notOk(tx, `Expected total=${expectedTotal}, but linked payments=${totalPayments} (#payments=${nrOfPayments})`)
    }


  }

  async checkTransactions(yearMonth: YearMonth): Promise<ConsistencyReportBank> {

    const report = new ConsistencyReportBank()

    let startDate = yearMonth.startDate()
    let endDate = dateFns.addMonths(startDate, 1)

    let txs = await this.alteaDb.getBankTransactionsBetween(startDate, endDate, null, { payments: true, positiveAmount: true })

    let updates = []

    for (let tx of txs) {

      let txCheckRes = this.checkTransaction(tx)

      if (txCheckRes.ok) {

        if (!tx.ok) {

          let update = {
            id: tx.id,
            ok: true
          }

          tx.ok = true
          updates.push(update)
        }


        report.count.ok++
      } else {

        if (tx.ok) {
          let update = {
            id: tx.id,
            ok: false
          }

          tx.ok = false
          updates.push(update)
        }

        report.count.errors++
        report.errors.push(txCheckRes)
      }

    }


    if (ArrayHelper.NotEmpty(updates)) {
      var updateRes = await this.alteaDb.updatePartialObjects('bankTransaction', BankTransaction, updates)
      console.warn(updateRes)

    }



    console.log(txs)

    return report
  }




}