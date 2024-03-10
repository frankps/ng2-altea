

//import { PrismaClient, Organisation as OrganisationModel, Prisma } from '@prisma/client'
import { ApiBatchItemResult, ApiBatchProcess, ApiBatchResult, ApiListResult, ApiResult, ApiStatus, DbObjectCreate, DbObjectMulti, DbQueryTyped, ManagedObject, ObjectHelper, ObjectWithId, QueryOperator } from 'ts-common';
import { plainToClass, instanceToPlain, plainToInstance } from "class-transformer"
import { CanUseGift, Gift, Message, MsgType, Order, OrderLine, Payment, PaymentType, Subscription } from 'ts-altea-model';
import { AlteaDb } from '../general/altea-db';
import { IDb } from '../interfaces/i-db';


export class PaymentProcessing {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    async doGiftPayments(payments: Payment[]): Promise<ApiListResult<Gift | CanUseGift>> {

        let newPayments: Payment[] = []

        newPayments = payments.filter(pay => pay?.m?.n === true)

        const newGiftPayments = newPayments.filter(pay => pay.type == PaymentType.gift)

        if (newGiftPayments.length == 0)
            return new ApiListResult([], ApiStatus.ok, 'No gift payments to process!')

        const giftIds = newGiftPayments.map(pay => pay.giftId)

        let gifts: Gift[] = await this.alteaDb.getGiftsByIds(giftIds)   

        console.info('gifts', gifts)

        let allOk = true

        let result: ApiListResult<CanUseGift> = new ApiListResult<CanUseGift>()
        result.status = ApiStatus.ok
        let giftsToUpdate = []

        if (newGiftPayments.length > 0) {

            for (let giftPayment of newGiftPayments) {

                let gift = gifts.find(g => g.id == giftPayment.giftId)

                let canUse = gift.canUse(giftPayment.amount)
                result.data.push(canUse)

                if (canUse.valid && canUse.amount > 0) {
                    gift.use(canUse.amount)
                    giftsToUpdate.push(gift)
                }
                else {
                    result.status = ApiStatus.error
                }
            }
        }

        if (!result.isOk || giftsToUpdate.length == 0) {
            return result
        }

        let updateGiftResult = await this.alteaDb.updateGifts(giftsToUpdate, ['used', 'isConsumed'])

        return updateGiftResult

    }





    async doSubscriptionPayments(payments: Payment[]): Promise<ApiListResult<Subscription>> {
        let newPayments: Payment[] = []

        newPayments = payments.filter(pay => pay?.m?.n === true)

        const newSubscriptionPayments = newPayments.filter(pay => pay.type == PaymentType.subs && pay.subsId)

        if (newSubscriptionPayments.length == 0)
            return new ApiListResult([], ApiStatus.ok, 'No subscription payments to process!')

        const subsIds = newSubscriptionPayments.map(pay => pay.subsId)

        let subs: Subscription[] = await this.alteaDb.getSubscriptionsByIds(subsIds)

        let subscriptionsToUpdate = []


        for (let subsPayment of newSubscriptionPayments) {

            let subscription = subs.find(s => s.id == subsPayment.subsId)


            if (subscription.active && subscription.usedQty < subscription.totalQty) {

                subscription.usedQty++

                if (subscription.usedQty >= subscription.totalQty) {
                    subscription.active = false
                }

                subscriptionsToUpdate.push(subscription)

            }
        }

        let updateGiftResult = await this.alteaDb.updateSubscriptions(subscriptionsToUpdate, ['usedQty', 'active'])

        return updateGiftResult
    }

}