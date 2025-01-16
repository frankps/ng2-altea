import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"
import { BankTransaction, BankTxType, Payment, PaymentInfo, PaymentType, StripePayout } from 'ts-altea-model'
import { ApiStatus, ArrayHelper, DateHelper } from 'ts-common'


export class BankTransactionLinking {


  alteaDb: AlteaDb

  constructor(db: IDb | AlteaDb) {

    if (db instanceof AlteaDb)
      this.alteaDb = db
    else
      this.alteaDb = new AlteaDb(db)
  }

  async assignStripePayoutsToTransactions(payouts: StripePayout[], txs: BankTransaction[]): Promise<BankTransaction[]> {

    if (ArrayHelper.IsEmpty(payouts) || ArrayHelper.IsEmpty(txs))
      return []

    let payoutsOldToNew = _.reverse(payouts)

    let newlyLinked: BankTransaction[] = []

    for (let payout of payoutsOldToNew) {

      let foundIdx = txs.findIndex(tx => tx.providerRef == payout.id)

      if (foundIdx >= 0) {
        let tx = txs[foundIdx]
        console.log(`Payout already linked ${payout.id} <-> ${tx.num}`)
        continue
      }

      let payoutDateNum = payout.dateNum

      let matchIdx = txs.findIndex(tx => tx.type == BankTxType.stripe && tx.amount == payout.amountValue && tx.valDate == payoutDateNum)

      if (matchIdx >= 0) {
        let tx = txs[matchIdx]
        tx.providerRef = payout.id

        console.log(`Match found ${payout.id} <-> ${tx.num}`)
        console.log(tx)

        let res = await this.alteaDb.updateBankTransaction(tx, ['providerRef'])

        if (res.status == ApiStatus.ok) {
          newlyLinked.push(tx)
        }
        console.log(res)
        continue

      }
    }

    return newlyLinked
  }





  getStripeAmounts(stripeTx: any[]): number[] {

    if (ArrayHelper.IsEmpty(stripeTx))
      return []

    let payTxs = stripeTx.filter(tx => tx.type != 'payout')

    let amounts = payTxs.map(tx => {
      let amount = _.round(tx.amount / 100, 2)
      return amount
    })

    return amounts


  }





  /**
   * In case we can't use paymentIntentIds
   * @param tx 
   */
  async fallBackStripeLinking(tx: BankTransaction) {

    let stripeTransactions: any[] = tx.prov.transactions

    if (ArrayHelper.IsEmpty(stripeTransactions)) {
      console.error(`Can't use fallBackStripeLinking: tx.prov.transactions is empty!`)
    }

    let stripeAmounts = this.getStripeAmounts(stripeTransactions)
    let stripeTotal = _.sum(stripeAmounts)



    let start = tx.execDateObject()

    let end = start
    start = dateFns.addDays(start, -8)

    let payments = await this.alteaDb.getPaymentsBetween(start, end, [PaymentType.stripe], false)
    let totalsByDay = payments.getTotalsByDay()


    let days = totalsByDay.keys()

    for (let day of days) {

      let totalOnDay = totalsByDay.get(day)

      if (totalOnDay == stripeTotal) {

        console.warn('FOUND!!!  do work ....')

        let paysOnDay = payments.getPaysOnDay(day)
        let totalAmount = 0, totalFee = 0
        let refDate

        for (let payment of paysOnDay) {

          let stripeTx = stripeTransactions.find(stripeTx => _.round(stripeTx.amount / 100, 2) == payment.amount)

          if (!stripeTx) {
            console.log(`No Stripe transaction found for amount ${payment.amount}`)
            continue
          }

          let amount = _.round(stripeTx.amount / 100, 2)
          totalAmount += amount

          payment.bankTxId = tx.id
          payment.bankTxNum = tx.num
          payment.fee = _.round(stripeTx.fee / 100, 2)
          totalFee += payment.fee

          if (!refDate && payment.dateTyped)
            refDate = DateHelper.yyyyMMdd(payment.dateTyped)

          payment.lnk = true

        }

        if (totalAmount == stripeTotal) {
          tx.ok = true
          tx.cost = _.round(totalFee, 2)
          tx.orig = _.round(tx.cost + tx.amount, 2)

          if (refDate && !tx.refDate) {
            tx.refDate = refDate
          }

          var txUpdate = await this.alteaDb.updateBankTransaction(tx, ['ok', 'cost', 'orig', 'refDate'])

          console.log(txUpdate)

          var updateResult = await this.alteaDb.updatePayments(paysOnDay, ['fee', 'bankTxId', 'bankTxNum', 'lnk'])

          console.log(updateResult)
        }

        return true
      }
    }



    return false


    console.log(payments)


  }

  stripeNumToDate(num: number): Date {
    var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
    d.setUTCSeconds(num)
    return d
  }

  async linkStripe(tx: BankTransaction): Promise<Payment[]> {

    if (!tx.prov) {
      console.error('No Stripe provider provider info available for linking!')
      return []
    }

    let stripeTransactions: any[] = tx.prov.transactions

    if (ArrayHelper.IsEmpty(stripeTransactions)) {
      let err = 'No Stripe transactions available at BankTransaction.prov.transactions'
      console.error(err)
      return []
    }

    stripeTransactions = stripeTransactions.filter(tx => tx.type != 'payout')
    let paymentIntentIds: string[] = stripeTransactions.map(tx => tx.source?.payment_intent).filter(id => id != null && id != undefined)
    // for (let stripeTx of tx.prov.transactions)

    if (ArrayHelper.IsEmpty(paymentIntentIds) || paymentIntentIds.length != stripeTransactions.length) {
      /*
      let created = stripeTransactions[0].source.arrival_date
      let creationDate = this.stripeNumToDate(created)

      console.error(creationDate)
      */
      await this.fallBackStripeLinking(tx)
      return []
    }


    console.error(paymentIntentIds)

    let payments = await this.alteaDb.getPaymentsByProvIds(paymentIntentIds)

    if (!payments)
      payments = []


    let paymentIntentIdsNotLinked = paymentIntentIds.filter(pi => payments.findIndex(p => p.provId == pi) == -1)

    if (ArrayHelper.NotEmpty(paymentIntentIdsNotLinked)) {

      for (let piId of paymentIntentIdsNotLinked) {

        let stripeTx = stripeTransactions.find(tx => tx.source?.payment_intent == piId)
        stripeTx['link'] = ''
      }

    }


    if (ArrayHelper.IsEmpty(payments)) {
      let err = 'No internal payments found'
      console.error(err)
      return []
    }

    let errors: PaymentInfo[] = []

    let refDate

    let totalAmount = 0, totalFee = 0
    for (let payment of payments) {

      let stripeTx = stripeTransactions.find(stripeTx => stripeTx.source?.payment_intent == payment.provId)

      let amount = _.round(stripeTx.amount / 100, 2)
      totalAmount += amount

      payment.bankTxId = tx.id
      payment.bankTxNum = tx.num
      payment.fee = _.round(stripeTx.fee / 100, 2)
      totalFee += payment.fee

      if (!refDate && payment.dateTyped)
        refDate = DateHelper.yyyyMMdd(payment.dateTyped)


      if (amount != payment.amount) {
        payment.lnk = false
        stripeTx['link'] = ''
        errors.push(PaymentInfo.error(payment, `Payment.amount (${payment.amount}) not matching with Stripe (${amount})`))
      } else {
        stripeTx['link'] = 'ok'
        payment.lnk = true
      }
    }






    console.warn('Errors:', payments)
    console.log(payments)

    let toReceiveFromStripe = _.round(totalAmount - totalFee, 2)
    let receivedFromStripe = _.round(tx.amount, 2)

    if (toReceiveFromStripe == receivedFromStripe) {

      tx.ok = true
      tx.cost = _.round(totalFee, 2)
      tx.orig = _.round(tx.cost + tx.amount, 2)

      if (refDate && !tx.refDate) {
        tx.refDate = refDate
      }

      var txUpdate = await this.alteaDb.updateBankTransaction(tx, ['ok', 'prov', 'cost', 'orig', 'refDate'])
      console.log(txUpdate)

    } else {

      let error = `Received from Stripe (${receivedFromStripe}) not equal to sum stripe payments (${toReceiveFromStripe})`
      console.error(error)

    }

    var updateResult = await this.alteaDb.updatePayments(payments, ['fee', 'bankTxId', 'bankTxNum', 'lnk'])

    console.log(updateResult)

    return payments

  }



}