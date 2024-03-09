

//import { PrismaClient, Organisation as OrganisationModel, Prisma } from '@prisma/client'
import { ApiBatchItemResult, ApiBatchProcess, ApiBatchResult, ApiListResult, ApiResult, ApiStatus, DbObject, DbObjectMulti, DbQueryTyped, ManagedObject, ObjectHelper, ObjectWithId, QueryOperator } from 'ts-common';
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


    async doSubscriptionPayments(payments: Payment[]): Promise<ApiListResult<Subscription>> {
        let newPayments: Payment[] = []

        newPayments = payments.filter(pay => pay?.m?.n === true)

        const newSubscriptionPayments = newPayments.filter(pay => pay.type == PaymentType.subs && pay.subsId)

        if (newSubscriptionPayments.length == 0)
            return new ApiListResult([], ApiStatus.ok, 'No subscription payments to process!')

        const subsIds = newSubscriptionPayments.map(pay => pay.subsId)

        const subsQry = new DbQueryTyped<Subscription>('subscription', Subscription)
        subsQry.and('id', QueryOperator.in, subsIds)

        let subs: Subscription[] = await this.alteaDb.db.query$<Subscription>(subsQry)

        let subscriptionsToUpdate = []

        //return new ApiResult({}, ApiStatus.ok)

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

        let dbObjectMany = new DbObjectMulti('subscription', Subscription, subs)
        dbObjectMany.objects = ObjectHelper.extractArrayProperties(subscriptionsToUpdate, ['id', 'usedQty', 'active'])

        let updateGiftResult = await this.alteaDb.db.updateMany$(dbObjectMany)

        return updateGiftResult
    }

}