/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, ArrayHelper, DateHelper, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
import { Subscription, Order, Gift, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo,  PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MsgInfo, ConfirmOrderResponse, PaymentType, Payment, OrderType, OrderLine, GiftType, OrderCancel, TemplateCode, CompensationGiftReason } from 'ts-altea-model'
import { Observable } from 'rxjs'
import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import { CreateResourceRequest } from './reservation/create-resource-request'
import { CreateAvailabilityContext } from './reservation/create-availability-context'
import { SlotFinder } from './reservation/slot-finder'
import { ResourceRequestOptimizer } from './reservation/resource-request-optimizer'
import { SolutionPicker } from './reservation/solution-picker'
import { DetermineReservationOptions } from './reservation/determine-reservation-options'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"
import { DefaultGiftText, GiftMessaging } from 'ts-altea-logic'


export enum CancelOrderMessage {
    possible = "possible",
    alreadyCancelled = "alreadyCancelled",
    giftAlreadyUsed = "giftAlreadyUsed",
    subscriptionAlreadyUsed = "subscriptionAlreadyUsed",
    noMoreFreeCancel = "noMoreFreeCancel"
}

export class CancelOrderRequest {

}

export class CancelOrderChecks {

    /** if order was a gift, we return the gift */
    gift: Gift

    /** if order was the purchase of 1 or more subscriptions, we return the subscriptions */
    subscriptions: Subscription[]


    freeCancelBefore: Date
    freeCancelMinHours: number


    //totalActualPaid: number = 0

    hasSubsPayments = false


    subsPayments = []

    constructor(public message: CancelOrderMessage = CancelOrderMessage.possible) {

    }

    hasProblems() {
        return (this.message != CancelOrderMessage.possible)
    }

    static get success(): CancelOrderChecks {
        return new CancelOrderChecks(CancelOrderMessage.possible)
    }

}

/** CancelOrderActions: keep track of actions performed by cancelling an order.
 *  
 * Examples:
 *  - create a compensation gift
 *  - re-increment existing gift that were used as payments
 * 
 */


export enum OrderActionType {
    newGiftOrder,
    incrementUsedGift,
    createCompensationGift
}

export class OrderAction {
    constructor(public type: OrderActionType, public objectId: string, public ok = false) {
    }

}

export class OrderGiftAction extends OrderAction {


    constructor(type: OrderActionType, public giftId: string, public giftCode: string, public value: number, ok: boolean, public origUsed: number = 0, public newUsed: number = 0) {
        super(type, giftId, ok)
    }
}


/** The various actions performed  */
export class OrderActions {
    actions: OrderAction[] = []

    gifts: Gift[] = []

    add(action: OrderAction) {
        this.actions.push(action)
    }

    getById(objectId: string): OrderAction {

        const action = this.actions.find(a => a.objectId == objectId)

        return action
    }

    isOk(): boolean {

        const notOkIdx = this.actions.findIndex(a => !a.ok)

        return (notOkIdx == -1)
    }

}

export class CancelOrder {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }

    async checks(order: Order): Promise<CancelOrderChecks> {

        /*         order.branch.cancel
                order.startDate */

        const checkResponse = new CancelOrderChecks()

        if (order.state == OrderState.cancelled) {
            checkResponse.message = CancelOrderMessage.alreadyCancelled
            return checkResponse
        }

        if (order.start && order.branch.cancel) {

            let cancelMinHours = order.cancelMinHours()

            const freeCancelBefore = dateFns.subHours(order.startDate, cancelMinHours)

            let now = new Date()
            if (now > freeCancelBefore) {
                checkResponse.message = CancelOrderMessage.noMoreFreeCancel
                checkResponse.freeCancelBefore = freeCancelBefore
                checkResponse.freeCancelMinHours = cancelMinHours
                return checkResponse
            }

        }




        /** Check if order was a gift (order) */

        if (order.gift) {
            let gift = await this.alteaDb.getGiftByOrderId(order.id)
            checkResponse.gift = gift

            if (gift?.used > 0) {
                //  const response = new CancelOrderResponse(CancelOrderMessage.giftAlreadyUsed)
                checkResponse.message = CancelOrderMessage.giftAlreadyUsed
                return checkResponse
            }
        }

        /** Order was a purchase of subscriptions */

        let subscriptions = await this.alteaDb.getSubscriptionsByOrderId(order.id)

        checkResponse.subscriptions = subscriptions

        if (ArrayHelper.AtLeastOneItem(subscriptions)) {

            checkResponse.message = CancelOrderMessage.subscriptionAlreadyUsed

            return checkResponse
        }


        if (ArrayHelper.AtLeastOneItem(order.payments)) {

            /** Use of a subscription */
            checkResponse.subsPayments = order.payments.filter(p => p.type == PaymentType.subs)

            if (ArrayHelper.AtLeastOneItem(checkResponse.subsPayments)) {
                checkResponse.hasSubsPayments = true


            }


        }




        return checkResponse

    }


    async cancelOrder(order: Order, orderCancel: OrderCancel): Promise<ApiResult<Order>> {  // 


        if (orderCancel.hasCompensation()) {

            const compensateResult = await this.compensateOrder(order, orderCancel.compensation, CompensationGiftReason.canceledOrder)

            if (!compensateResult) {
                console.warn(compensateResult)
            }



        }

        if (orderCancel.returnSubsPayments) {

            const subscriptionPayments = order.paymentsOfType(PaymentType.subs)

            const subscriptionIds = subscriptionPayments.map(pay => pay.subsId)
            const subscriptions = await this.alteaDb.getSubscriptionsByIds(subscriptionIds)

            subscriptions.forEach(subscription => {

                if (subscription.usedQty <= 0)
                    return

                subscription.usedQty = subscription.usedQty - 1

                // re-activate again if previously inactive (because it might have been completly used)
                subscription.act = true


            })


            const updateSubscriptionResult = this.alteaDb.updateSubscriptions(subscriptions, ['usedQty', 'act'])


        }

        order.cancel = orderCancel
        order.state = OrderState.cancelled
        order.act = false


        order.m.setDirty('cancel', 'state', 'act')

        await this.alteaDb.deletePlanningsForOrders([order.id])

        const saveOrderResult = await this.alteaDb.saveOrder(order)
        console.warn(saveOrderResult)

        return saveOrderResult

    }


    async compensateOrder(order: Order, amountToCompensate: number, reason: CompensationGiftReason, sendTemplate?: TemplateCode): Promise<OrderActions> {

        const compensateOrderActions = new OrderActions()

        let amountStillToCompensate = amountToCompensate

        let infos = [`Moved €${amountToCompensate} to gift(s) `]

        // first check if there are gift payments not yet declared => free these ones first
        let giftPaysNotDeclared = order.payments.filter(p => p.type == PaymentType.gift && !p.decl && p.act && p.giftId)

        if (ArrayHelper.AtLeastOneItem(giftPaysNotDeclared)) {

            // order by amount from highest to lowest
            giftPaysNotDeclared = _.orderBy(giftPaysNotDeclared, ['amount'], ['desc'])

            let giftIds = giftPaysNotDeclared.map(gift => gift.id)
            let gifts = await this.alteaDb.getGiftsByIds(giftIds)
            const giftsToUpdate = []

            for (let giftPay of giftPaysNotDeclared) {

                let gift = gifts.find(g => g.id == giftPay.giftId)

                if (!gift)
                    continue

                const origUsed = gift.used

                const freeGiftAmount = Math.min(giftPay.amount, amountStillToCompensate)
                gift.free(freeGiftAmount)

                giftsToUpdate.push(gift)

                // keep track of this action
                let giftAction = new OrderGiftAction(OrderActionType.incrementUsedGift, gift.id, gift.code, gift.value, false, origUsed, gift.used)
                infos.push(gift.code)
                compensateOrderActions.add(giftAction)

                amountStillToCompensate -= freeGiftAmount

                if (amountStillToCompensate <= 0)
                    break
            }

            if (ArrayHelper.AtLeastOneItem(giftsToUpdate)) {
                const updateGiftResult = await this.alteaDb.updateGifts(giftsToUpdate, ['used', 'isConsumed'])
                console.warn(updateGiftResult)

                if (updateGiftResult.isOk && ArrayHelper.AtLeastOneItem(updateGiftResult.data)) {

                    updateGiftResult.data.forEach(gift => {
                        let cancelAction = compensateOrderActions.getById(gift.id)
                        cancelAction.ok = true
                    })



                }

            }

        }

        // above we tried to undo existing gift payments
        // if there is still an open amount to compensate, we create a new gift
        if (amountStillToCompensate > 0) {
            const res: OrderActions = await this.createCompensationGiftOrder(amountStillToCompensate, order, reason, sendTemplate)

            if (ArrayHelper.NotEmpty(res.gifts))  // we expect that 1 gift is created
                infos.push(...res.gifts.map(g => g.code))

            if (res?.actions)
                compensateOrderActions.actions.push(...res.actions)
        }

        console.warn('CancelOrderActions', compensateOrderActions)

        const info = infos.join(' ')  // to be used in orderline descr

        await this.rebalanceOrder(order, amountToCompensate, reason, info)

        return compensateOrderActions

    }



    async rebalanceOrder(order: Order, compensatedAmount: number, reason: CompensationGiftReason, description: string): Promise<any> {


        if (reason != CompensationGiftReason.overpaid) {
            let line = new OrderLine()
            line.unit = -compensatedAmount
            line.descr = description
            line.vatPct = 0
            //line.json = cancelActions

            order.addLine(line, false)
        }


        const pay = new Payment()

        pay.type = PaymentType.cash
        pay.amount = -compensatedAmount
        pay.info = description
        //pay.orderId = order.id

        order.addPayment(pay)

    }


    async createCompensationGiftOrder(amount: number, origOrder: Order, reason: CompensationGiftReason, sendTemplate?: TemplateCode): Promise<OrderActions> {

        const cancelOrderActions = new OrderActions()

        let branch = origOrder.branch

        let order = new Order(branch.unique, true)
        order.branchId = origOrder.branchId
        order.branch = origOrder.branch
        order.contactId = origOrder.contactId
        order.state = OrderState.finished

        if (origOrder.for)
            order.for = origOrder.for
        else if (origOrder.contact)
            order.for = origOrder.contact.name


        let line = new OrderLine()
        line.unit = amount
        //  line.orderId = order.id
        line.descr = 'Gift for canceled order'
        line.vatPct = 0

        order.addLine(line, false)

        let pay = new Payment()
        pay.type = PaymentType.cash
        pay.amount = amount
        //pay.orderId = order.id

        order.addPayment(pay)  //payments.push(pay)


        let gift = new Gift(true, true)

        order.gift = true
        order.giftCode = gift.code

        const saveOrderResult = await this.alteaDb.saveOrder(order)
        const newOrder = saveOrderResult.object

        console.log(`Compensation gift order created`, saveOrderResult)

        let cancelAction = new OrderAction(OrderActionType.newGiftOrder, newOrder.id, saveOrderResult.isOk)
        cancelOrderActions.add(cancelAction)

        if (!saveOrderResult.isOk)
            return cancelOrderActions

        gift.toId = origOrder.contactId
        gift.branchId = origOrder.branchId
        gift.type = GiftType.amount
        gift.value = amount
        gift.orderId = newOrder.id

        if (origOrder.contact) {
            gift.toName = origOrder.contact.name
            gift.toEmail = origOrder.contact.email
            gift.methods.emailTo = true
        }

        switch (reason) {
            case CompensationGiftReason.overpaid:
                gift.toMessage = `Omzetting teveel betaald naar cadeaubon van order '${origOrder.code}'`
        }

        const createGiftResult = await this.alteaDb.createGift(gift)

        console.log(`Compensation gift created`, createGiftResult)

        let giftAction = new OrderGiftAction(OrderActionType.createCompensationGift, gift.id, gift.code, gift.value, createGiftResult.isOk)
        cancelOrderActions.add(giftAction)
        cancelOrderActions.gifts.push(gift)


        if (sendTemplate) {

            let template = await this.alteaDb.getTemplate(order.branchId, sendTemplate, MsgType.email)

            let giftMessaging = new GiftMessaging(this.alteaDb)

            let branch = order.branch

            if (!branch)
                branch = await this.alteaDb.getBranch(order.branchId)


            let defaultText = new DefaultGiftText()
            defaultText.toMessagePrefix = `Extra info:`

            let msg = giftMessaging.merge(branch, template, gift, defaultText)
            msg.orderId = origOrder.id
            msg.giftId = gift.id

            if (msg) {
                const sendRes = await this.alteaDb.db.sendMessage$(msg)
                console.log(sendRes)
            }

        }


        return cancelOrderActions
    }

}
