import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"
import { BankTransaction, BankTxType, Payment, PaymentInfo, Payments, PaymentType, StripePayout } from 'ts-altea-model'
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



export class ConsistencyReportBank {

  count = {
    ok: 0,
    errors: 0
  }

  errors: BankTransactionCheckResult[] = []

}


export class ConsistencyReport {

  bank: ConsistencyReportBank


  paysNotLinkedToBank: Payments
}


export class MonthConsistencyReportBuilder {

  alteaDb: AlteaDb

  constructor(db: IDb | AlteaDb) {

    if (db instanceof AlteaDb)
      this.alteaDb = db
    else
      this.alteaDb = new AlteaDb(db)
  }


  async checkAll(yearMonth: YearMonth): Promise<ConsistencyReport> {

    let report = new ConsistencyReport()

    report.bank = await this.checkTransactions(yearMonth)

    report.paysNotLinkedToBank = await this.checkPayments(yearMonth)

    return report
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

    expectedTotal = _.round(expectedTotal,2)
    totalPayments = _.round(totalPayments,2)

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