import { AlteaDb, IDb } from "ts-altea-logic"
import { LoyaltyCard, LoyaltyCardChange, Order, Payment, PaymentType, Subscription, Gift } from "ts-altea-model"
import { ArrayHelper } from "ts-common"
import * as _ from "lodash"
import * as dateFns from 'date-fns'

export class GiftProblem {

    code: string

    gift: Gift
   
    problem: string

    fix: string
}

/**
 * Sometimes gift payments are not registered on the gift itself. So customers can use gifts several times.
 */
export class FixGifts {
    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    async fixGifts() {

        let aquasenseId = '66e77bdb-a5f5-4d3d-99e0-4391bded4c6c'
        let start = new Date(2026, 0, 1)
        let end = dateFns.addMonths(start, 5)

        let payments = await this.alteaDb.getPaymentsBetween(aquasenseId, start, end, [PaymentType.gift], false, ['gift.payments'])

        if (ArrayHelper.IsEmpty(payments?.list)) {
            console.error('No gifts found')
            return
        }

        let processedGiftIds : string[] = []
        let problems: GiftProblem[] = []
        let giftsToUpdate: Gift[] = []

        for (let payment of payments.list) {

            let gift = payment.gift

            if (processedGiftIds.includes(gift.id)) {
                continue
            }

            processedGiftIds.push(gift.id)
           
            let nrOfPayments = gift.payments.length
            let totalOfPayments = _.sumBy(gift.payments, 'amount')

            if (gift.used < totalOfPayments) {
                let problem = new GiftProblem()

                problem.code = gift.code
                problem.gift = gift


                let nrOfPaymentsString = ''

                if (nrOfPayments > 1) {
                    nrOfPaymentsString = `  nr of payments: ${nrOfPayments}`
                }

                problem.problem = `${gift.code} payments=${totalOfPayments} <> used=${gift.used} of ${gift.value} ${nrOfPaymentsString}`

                problems.push(problem)


                let availableAmount = gift.availableAmount()

                problem.fix = `new used ${totalOfPayments}`
                gift.used = totalOfPayments
                giftsToUpdate.push(gift)


/*                 if (gift.used == 0) {
                    if (totalOfPayments <= availableAmount) {
                    }
                } */




            }
            
            
        }


        console.log(problems)

       var res = await this.alteaDb.updateGifts(giftsToUpdate, ['used'])

       console.log(res)

        
    }


}