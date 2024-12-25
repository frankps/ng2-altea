import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"
import { BankTransaction, BankTxType, PaymentInfo, StripePayout } from 'ts-altea-model'
import { ApiStatus, ArrayHelper } from 'ts-common'


export class BankTransactionLinking {


    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }

    

    async assignStripePayoutsToTransactions(payouts: StripePayout[], txs: BankTransaction[]) : Promise<BankTransaction[]> {

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

    async linkStripe(tx: BankTransaction) {

        if (!tx.prov) {
          console.error('No Stripe provider provider info available for linking!')
          return
        }

        let stripeTransactions: any[] = tx.prov.transactions
    
        if (ArrayHelper.IsEmpty(stripeTransactions)) {
          let err = 'No Stripe transactions available at BankTransaction.prov.transactions'
          console.error(err)
          return
        }
    
        let paymentIntentIds: string[] = stripeTransactions.map(tx => tx.source?.payment_intent).filter(id => id != null && id != undefined)
        // for (let stripeTx of tx.prov.transactions)
    
        console.error(paymentIntentIds)

        let payments = await this.alteaDb.getPaymentsByProvIds(paymentIntentIds)

        if (ArrayHelper.IsEmpty(payments)) {
            let err = 'No internal payments found'
            console.error(err)
            return
        }

        let errors: PaymentInfo[] = []

        let totalAmount = 0, totalFee = 0
        for (let payment of payments) {

            let stripeTx = stripeTransactions.find(stripeTx => stripeTx.source?.payment_intent == payment.provId)

            let amount = _.round(stripeTx.amount / 100, 2)
            totalAmount += amount

            payment.bankTxId = tx.id
            payment.fee = _.round(stripeTx.fee / 100, 2)
            totalFee += payment.fee

            if (amount != payment.amount) {
                payment.lnk = false
                errors.push(PaymentInfo.error(payment, `Payment.amount (${payment.amount}) not matching with Stripe (${amount})`))
            } else {
                payment.lnk = true
            }
        }

        console.warn('Errors:', payments)
        console.log(payments)

        let toReceiveFromStripe = _.round(totalAmount - totalFee, 2)
        let receivedFromStripe = _.round(tx.amount, 2)

        if (toReceiveFromStripe == receivedFromStripe) {

            tx.ok = true
            var txUpdate = await this.alteaDb.updateBankTransaction(tx, ['ok'])
            console.log(txUpdate)

        } else {

            let error = `Received from Stripe (${receivedFromStripe}) not equal to sum stripe payments (${toReceiveFromStripe})` 
            console.error(error)

        }

        var updateResult = await this.alteaDb.updatePayments(payments, ['fee', 'bankTxId', 'lnk'])

        console.log(updateResult)
      }



}