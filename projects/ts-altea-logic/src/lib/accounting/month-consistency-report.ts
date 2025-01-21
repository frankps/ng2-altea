import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"
import { BankTransaction, BankTxType, Invoice, Order, Payment, PaymentInfo, Payments, PaymentType, StripePayout } from 'ts-altea-model'
import { ApiStatus, ArrayHelper, YearMonth } from 'ts-common'


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


export class CheckResults {

  msg: string[] = []

  addMsg(msg: string): CheckResults {
    this.msg.push(msg)

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


  async checkAll(yearMonth: YearMonth): Promise<ConsistencyReport> {

    let report = new ConsistencyReport()

    report.invoices = await this.invoiceChecks(yearMonth)

    report.gifts = await this.giftChecks(yearMonth)

    report.bank = await this.checkTransactions(yearMonth)

    report.paysNotLinkedToBank = await this.checkPayments(yearMonth)

    return report
  }

  async invoiceChecks(yearMonth: YearMonth): Promise<CheckResults> {


    let result = new CheckResults()


    let yearMonthNum = yearMonth.toNumber()

    let start = yearMonth.startDate()
    let end = yearMonth.endDate()


    /** all orders invoiced? */

    let ordersInvoiceProblem = await this.alteaDb.getOrdersMissingInvoice(this.branchId)

    if (ArrayHelper.NotEmpty(ordersInvoiceProblem)) {

      result.addMsg(`${ordersInvoiceProblem.length} orders with invoice problem, trying to solve...`)

      let ordersToUpdate: Order[] = []

      for (let order of ordersInvoiceProblem) {

        let orderInvoiceOk = false

        console.log('invoiceId')

        if (order.invoiceId && order.invoice) {

          

          if (order.incl == order.invoice.totals.incl) {
            orderInvoiceOk = true
          } else {
            
          }

          if (orderInvoiceOk) {
            order.invoiced = true
            order.invoiceNum = order.invoice.num

            ordersToUpdate.push(order)
          }
        }

        if (!orderInvoiceOk) {

          let createdAt = dateFns.format(order.cre, 'dd/MM/yy')
          result.addMsg(`${order.for} created at ${createdAt}  has invoice problem... (${order.id})`)

        }


      }

      if (ArrayHelper.NotEmpty(ordersToUpdate)) {
        let updateRes = await this.alteaDb.updateOrders(ordersToUpdate, ['invoiced', 'invoiceNum'])

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
        result.addMsg(`corresponding order for '${gift.code}' invoiced? toInvoice=${order.toInvoice} invoiced=${order.invoiced} invoiceNum=${order.invoiceNum}`)
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

    let giftPays = await this.alteaDb.getPaymentsBetween(start, end, [PaymentType.gift], true, ['gift'])

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



  async checkPayments(yearMonth: YearMonth): Promise<Payments> {

    let start = yearMonth.startDate()
    let end = dateFns.addMonths(start, 1)  // yearMonth.endDate()

    let pays = await this.alteaDb.getPaymentsBetween(start, end, [PaymentType.credit, PaymentType.debit, PaymentType.stripe], true)

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