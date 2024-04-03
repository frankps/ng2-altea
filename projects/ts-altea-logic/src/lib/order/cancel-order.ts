/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, ArrayHelper, DateHelper, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
import { Subscription, Order, Gift, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, ResourceAvailability, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MsgInfo, ConfirmOrderResponse, PaymentType, Payment, OrderType, OrderLine, GiftType, OrderCancel } from 'ts-altea-model'
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

export enum CancelOrderMessage {
    success = "success",
    alreadyCancelled = "alreadyCancelled",
    giftAlreadyUsed = "giftAlreadyUsed",
    subscriptionAlreadyUsed = "subscriptionAlreadyUsed",
    noMoreFreeCancel = "noMoreFreeCancel"
}

export class CancelOrderRequest {

}

export class CancelOrderResponse {

    gift: Gift

    subscriptions: Subscription[]


    freeCancelBefore: Date
    freeCancelMinHours: number

    constructor(public message: CancelOrderMessage = CancelOrderMessage.success) {

    }

    hasProblems() {
        return (this.message != CancelOrderMessage.success)
    }

    static get success(): CancelOrderResponse {
        return new CancelOrderResponse(CancelOrderMessage.success)
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

    async checks(order: Order): Promise<CancelOrderResponse> {

        /*         order.branch.cancel
                order.startDate */

        const response = new CancelOrderResponse()

        /*         if (order.state == OrderState.cancelled) {
                    response.message = CancelOrderMessage.alreadyCancelled
                    return response
                } */

        if (order.start && order.branch.cancel) {

            let cancelMinHours = order.cancelMinHours()

            const freeCancelBefore = dateFns.subHours(order.startDate, cancelMinHours)

            let now = new Date()
            if (now > freeCancelBefore) {
                response.message = CancelOrderMessage.noMoreFreeCancel
                response.freeCancelBefore = freeCancelBefore
                response.freeCancelMinHours = cancelMinHours
                return response
            }

        }


        if (order.gift) {
            let gift = await this.alteaDb.getGiftByOrderId(order.id)
            response.gift = gift

            if (gift?.used > 0) {
                //  const response = new CancelOrderResponse(CancelOrderMessage.giftAlreadyUsed)
                response.message = CancelOrderMessage.giftAlreadyUsed
                return response
            }
        }

        let subscriptions = await this.alteaDb.getSubscriptionsByOrderId(order.id)

        response.subscriptions = subscriptions

        if (ArrayHelper.AtLeastOneItem(subscriptions)) {
            //const response = new CancelOrderResponse(CancelOrderMessage.subscriptionAlreadyUsed)
            response.message = CancelOrderMessage.subscriptionAlreadyUsed

            return response
        }


        return CancelOrderResponse.success

    }


    async cancelOrder(order: Order, orderCancel: OrderCancel): Promise<ApiResult<Order>> {  // 


        if (orderCancel.hasCompensation()) {

            const compensateResult = await this.compensateOrder(order, orderCancel.compensation)

            if (!compensateResult) {
                console.warn(compensateResult)
            }


        }

        order.state = OrderState.cancelled
        order.act = false

        order.m.setDirty('state', 'act')

        let plannings = order.planning

        if (ArrayHelper.IsEmpty(plannings)) {
            plannings = await this.alteaDb.getResourcePlanningsByOrderId(order.id)
            order.planning = plannings
        }

        if (!ArrayHelper.IsEmpty(plannings)) {

            for (let planning of plannings) {
                planning.act = false
                planning.m.setDirty('act')
            }
        }

        if (orderCancel.hasCompensation())
            this.handlePayments(order, orderCancel.compensation)


        const saveOrderResult = await this.alteaDb.saveOrder(order)
        console.warn(saveOrderResult)

        return saveOrderResult




        /*   OLD LOGIC

                const checkResponse = await this.checks(order)
        
                if (checkResponse.hasProblems())
                    return checkResponse
        
        
                return checkResponse
        
                await this.handlePayments(order)
        
                return CancelOrderResponse.success
             */

    }


    async compensateOrder(order: Order, amountToCompensate: number): Promise<any> {

        let amountStillToCompensate = amountToCompensate

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

                const freeGiftAmount = Math.min(giftPay.amount, amountStillToCompensate)
                gift.free(freeGiftAmount)

                giftsToUpdate.push(gift)

                amountStillToCompensate -= freeGiftAmount

                if (amountStillToCompensate <= 0)
                    break
            }

            if (ArrayHelper.AtLeastOneItem(giftsToUpdate)) {
                const updateGiftResult = this.alteaDb.updateGifts(giftsToUpdate, ['used', 'isConsumed'])
            }
                
        }

        // above we tried to undo existing gift payments
        // if there is still an open amount to compensate, we create a new gift
        if (amountStillToCompensate > 0) {
            const res = await this.createCompensationGiftOrder(amountStillToCompensate, order)
        }

    }






    // to remove
    async handlePayments(order: Order, amountToCompensate: number): Promise<any> {

        /** the total payment amounts by giftId */
        const giftsToRelease = new Map<string, number>()

        const subscriptionsToRelease = []

        //  let amountToCompensate = 0

        for (let pay of order.payments) {



            switch (pay.type) {


                case PaymentType.gift:

                    if (!pay.giftId) // this type of payment should have a gift id specified
                        break

                    let giftId = pay.giftId
                    let already = 0

                    if (giftsToRelease.has(giftId))
                        already = giftsToRelease.get(giftId)

                    giftsToRelease.set(giftId, already + pay.amount)
                    break

                case PaymentType.subs:

                    if (!pay.subsId) // this type of payment should have a subscription id specified
                        break

                    subscriptionsToRelease.push(pay.subsId)
                    break

                case PaymentType.cash:
                case PaymentType.transfer:
                case PaymentType.debit:
                case PaymentType.credit:
                case PaymentType.stripe:

                    amountToCompensate += pay.amount

                    break

            }
        }

        if (amountToCompensate > 0) {

            const giftResult = await this.createCompensationGiftOrder(amountToCompensate, order)
            console.error(giftResult)

            if (!giftResult.isOk)
                return giftResult

            const newGift = giftResult.object as Gift

            let line = new OrderLine()
            line.unit = -amountToCompensate
            line.descr = 'Move value to new order/gift'
            line.vatPct = 0
            line.json = {
                orderId: newGift.orderId,
                giftId: newGift.code,
                giftCode: newGift.code
            }

            order.addLine(line, false)

            const pay = new Payment()

            pay.type = PaymentType.cash
            pay.amount = -amountToCompensate
            //pay.orderId = order.id

            order.addPayment(pay)
            const saveOrderResult = await this.alteaDb.saveOrder(order)




            return saveOrderResult
        }
    }

    async createCompensationGiftOrder(amount: number, origOrder: Order): Promise<ApiResult<Gift | Order>> {

        let order = new Order(true)
        order.branchId = origOrder.branchId
        order.branch = origOrder.branch
        order.contactId = origOrder.contactId
        order.state = OrderState.finished

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

        order.payments.push(pay)

        const saveOrderResult = await this.alteaDb.saveOrder(order)

        if (!saveOrderResult.isOk)
            return saveOrderResult

        const newOrder = saveOrderResult.object

        let gift = new Gift(true, true)
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

        const createGiftResult = await this.alteaDb.createGift(gift)

        return createGiftResult
    }

}
