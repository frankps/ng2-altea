

//import { PrismaClient, Organisation as OrganisationModel, Prisma } from '@prisma/client'
import { ApiBatchItemResult, ApiBatchProcess, ApiBatchResult, ApiListResult, ApiResult, ApiStatus, ArrayHelper, DbObjectCreate, DbObjectMulti, DbQueryTyped, ManagedObject, ObjectHelper, ObjectWithId, QueryOperator } from 'ts-common';
import { plainToClass, instanceToPlain, plainToInstance } from "class-transformer"
import { CanUseGift, Gift, LoyaltyCardChange, LoyaltyRewardType, Message, MsgType, Order, OrderLine, Payment, PaymentType, Subscription } from 'ts-altea-model';
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


    addMessage(msg: string, to: string[]) {
        to.push(msg)
        console.error(msg)
    }

    async doLoyaltyPayments(orderId: string, payments: Payment[]): Promise<ApiListResult<any>> {

        if (ArrayHelper.IsEmpty(payments))
            return ApiListResult.ok('No loyalty payments to process')

        const newLoyaltyPayments = payments.filter(pay => pay?.m?.n === true && pay.type == PaymentType.loyal)

        if (ArrayHelper.IsEmpty(newLoyaltyPayments))
            return ApiListResult.ok('No new loyalty payments to process')

        let allOk = true
        let messages: string[] = []

        let result = new ApiListResult()
        let cardChanges: LoyaltyCardChange[] = []

        for (let loyaltyPay of newLoyaltyPayments) {

            const loyalPayInfo = loyaltyPay.loyal

            if (!loyalPayInfo) {
                allOk = false
                this.addMessage(`Missing loyalty info on payment: payment.loyal`, messages)
                continue
            }

            let cardId = loyalPayInfo.cardId
            let card = await this.alteaDb.getLoyaltyCardById(cardId)

            if (!card) {
                allOk = false
                this.addMessage(`Loyalty card ${cardId} not found!`, messages)
                continue
            } 

            let program = await this.alteaDb.getLoyaltyProgramById(card.programId)

            if (!program) {
                allOk = false
                this.addMessage(`Loyalty program ${card.programId} for card ${cardId} not found!`, messages)
                continue
            } 

            let reward = program.getRewardById(loyalPayInfo.rewardId)
            
            if (!reward) {
                allOk = false
                this.addMessage(`Loyalty reward ${loyalPayInfo.rewardId} for program ${card.programId} not found!`, messages)
                continue
            } 

            card.value -= reward.amount
            await this.alteaDb.updateLoyaltyCard(card, ['value'])

            const loyaltyChange = LoyaltyCardChange.newReward(orderId, cardId, reward.id, reward.amount)
            cardChanges.push(loyaltyChange)
            
        }

        const res = await this.alteaDb.createLoyaltyCardChanges(cardChanges)

        let msg = messages.join(`\n`)

        if (!allOk)
            return ApiListResult.error(msg)
        else
            return ApiListResult.ok(msg)
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
                    result.message += canUse.msg + " "
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


            if (subscription.act && subscription.usedQty < subscription.totalQty) {

                subscription.usedQty++

                if (subscription.usedQty >= subscription.totalQty) {
                    subscription.act = false
                }

                subscriptionsToUpdate.push(subscription)

            }
        }

        let updateGiftResult = await this.alteaDb.updateSubscriptions(subscriptionsToUpdate, ['usedQty', 'active'])

        return updateGiftResult
    }




}