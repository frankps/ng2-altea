/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, ArrayHelper, DateHelper, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
import { Order, Gift, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, ResourceAvailability, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MsgInfo, ConfirmOrderResponse, OrderSource, TemplateCode, OrderCancel, OrderCancelBy, CustomerCancelReasons, PaymentType, Payment } from 'ts-altea-model'
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
import { OrderMessaging } from './messaging/order-messaging'


export class AddPaymentToOrderParams {
    orderId: string
    type: PaymentType
    amount: number
    provId?: string
}






export class OrderMgmtService {


    // taskHub: TaskHub
    // this.taskHub = new TaskHub(this.alteaDb)


    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    async addPaymentToOrder(orderId: string, type: PaymentType, amount: number, provId?: string): Promise<ApiResult<Order>> {


        // 'lines:orderBy=idx.product', 'contact'
        const order = await this.alteaDb.getOrder(orderId, ...Order.defaultInclude)  // , 'lines:orderBy=idx.product', 'contact', 'payments:orderBy=idx'

        if (!order) {
            const msg = `Order not found: ${orderId}: can't add payment!`
            console.error(msg)
            return ApiResult.error(msg)
        }

        const payment = new Payment()
        payment.type = type
        payment.amount = amount
        payment.provId = provId
        payment.date = DateHelper.yyyyMMddhhmmss()

        order.addPayment(payment)

        const result = await this.alteaDb.saveOrder(order)

        if (!result.isOk)
            console.error(result.message)

        console.debug('Starting change state')
        await this.changeState(order)

        return result
    }

    async getBranches(orders: Order[]): Promise<Branch[]> {

        if (ArrayHelper.IsEmpty(orders))
            return []

        const uniq = _.uniqBy(orders, 'branchId')
        const branchIds = uniq.map(o => o.branchId)

        const branches = await this.alteaDb.getBranches(branchIds)

        return branches
    }


    /** set state to noDepositCancel */
    async cancelExpiredDeposistOrders(before: Date = new Date()): Promise<Order[]> {

        const beforeNum = DateHelper.yyyyMMddhhmmss(before)
        const orders = await this.alteaDb.getExpiredDepositOrders(before)

        if (ArrayHelper.IsEmpty(orders))
            return []

        const cancelledOrders: Order[] = []
        //const errors: ApiResult[] = []

        const branches = await this.getBranches(orders)

        // loop through branches

        for (let branch of branches) {

            const cancelledBranchOrders: Order[] = []
            const branchErrors: ApiResult[] = []

            let branchOrders = orders.filter(o => o.branchId == branch.id)

            for (let order of branchOrders) {

                try {
                    order.state = OrderState.cancelled

                    order.cancel = new OrderCancel()
                    order.cancel.reason = CustomerCancelReasons.noDeposit
                    order.cancel.date = new Date()
                    order.cancel.by = OrderCancelBy.int

                    order.msgCode = TemplateCode.resv_no_deposit_cancel
                    order.msgOn = beforeNum

                    order.m.setDirty('state', 'cancel', 'msgCode', 'msgOn')

                    const res = await this.alteaDb.saveOrder(order)

                    if (!res.isOk)
                        throw res

                    const del = this.alteaDb.deletePlanningsForOrder(order.id)

                    //msgSvc.noDepositCancel(order)

                    cancelledBranchOrders.push(res.object)

                } catch (err) {

                    const error = ApiResult.error('Error processing order', err, order)
                    branchErrors.push(error)

                }


                break  // for debugging, to have just 1 working
            }

            if (cancelledBranchOrders.length > 0 || branchErrors.length > 0) {
                const msgSvc = new OrderMessaging(this.alteaDb)
                await msgSvc.messageExpiredDepositCancels(branch, cancelledBranchOrders, branchErrors)
            }

            cancelledOrders.push(...cancelledBranchOrders)


        }




        return cancelledOrders
    }




    async saveOrder(order: Order, autoChangeState = false): Promise<ApiResult<Order>> {

        let orderApiResult = await this.alteaDb.saveOrder(order)

        if (orderApiResult.isOk && autoChangeState) {

            order = orderApiResult.object

            const newState = this.determineOrderState(order)

            if (newState && newState != order.state)
                orderApiResult = await this.changeState(order)

        }

        return orderApiResult
    }


    async test() {
        this.alteaDb.getOrders()
    }


    async depositTimeOuts() {


    }


    determineOrderState(order: Order): OrderState | null {
        -
            console.log(`determineOrderState for ${order?.id}: ${order.state} (deposit=${order.deposit} / paid=${order.paid})`)

        if ([OrderState.creation, OrderState.created, OrderState.waitDeposit].indexOf(order.state) >= 0) {


            if (order.paid >= order.deposit) {

                return OrderState.confirmed
            }
        }

        if (order.src == OrderSource.pos && order.state == OrderState.creation) {

            const hasServices = order.hasServices()

            if (order.contactId && (!hasServices || order.start)) {
                return OrderState.created
            }

        }


        return null
    }



    /**
     * 
     * @param order 
     * @param newState the new state, if null, then we try to find new state (typically to set to confirmed after deposit was paid)
     * @returns 
     */
    async changeState(order: Order, newState: OrderState | null = null): Promise<ApiResult<Order>> {  //  : Promise<ApiResult<Order>>

        const msgSvc = new OrderMessaging(this.alteaDb)

        if (newState == null) {
            newState = this.determineOrderState(order)

            console.debug(`new state =  ${newState}`)

            if (newState == null) {  // if still null (we can't find new state)
                const msg = `New order state not found for order ${order.id}!`
                console.error(msg)
                return new ApiResult<Order>(order, ApiStatus.error, msg)
            }
        }

        if (order.state == newState) {
            const msg = `Can't change state: order has already state '${newState}'`
            console.debug(msg)
            return new ApiResult<Order>(order, ApiStatus.notProcessed, msg)
        }

        order.state = newState
        order.m.setDirty('state')

        const result = await this.alteaDb.saveOrder(order)

        switch (newState) {
            case OrderState.created:

                /** if order was created internally (Point Of Sale) and still a deposit to pay */
                if (!order.gift && order.src == OrderSource.pos && order.depo && order.deposit > 0 && order.paid < order.deposit) {

                    // then we calculate depoBy date
                    const now = new Date()
                    const depoByDate = dateFns.addMinutes(now, order.depoMins)
                    order.depoBy = DateHelper.yyyyMMddhhmmss(depoByDate)
                    order.m.setDirty('depoBy')

                    await msgSvc.depositMessaging(order, true)
                    order.state = OrderState.waitDeposit


                } else {

                    this.changeState(order, OrderState.confirmed)

                }
                break

            case OrderState.waitDeposit:
                order.depoBy = DateHelper.yyyyMMddhhmmss()
                order.m.setDirty('depoBy')
                break

            case OrderState.confirmed:

                if (!order.gift)
                    var res = await msgSvc.confirmationMessaging(order)


                console.warn(res)

                break



        }

        console.warn(order)

        return result

    }






    /**
     * Saves the order, calculates & saves the resource plannings based on previously determined calculated solution
     * @param order 
     * @param reservationOption 
     * @param solution 
     * @returns 
     */
    async confirmOrder(order: Order, reservationOption: ReservationOption, solution: Solution): Promise<ApiResult<Order>> {   // ConfirmOrderResponse | undefined

        order.start = reservationOption.dateNum
        order.m.setDirty('start')

        const response = new ConfirmOrderResponse()

        response.plannings = this.createResourcePlanningsForNewOrder(order, reservationOption, solution)

        console.info(response.plannings)

        //order.planning.forEach(plan => order.m.r)

        order.deleteAllPlannings()

        order.addPlanning(...response.plannings)

        const orderApiResult = await this.alteaDb.saveOrder(order)

        return orderApiResult



        if (orderApiResult.status != ApiStatus.ok) {
            console.error(orderApiResult)
            return undefined
        }

        response.order = orderApiResult.object

        // const planningResult = await this.alteaDb.saveResourcePlannings(response.plannings)

        return orderApiResult

        /** Save all the resource plannings */
    }


    createResourcePlanningsForNewOrder(order: Order, reservationOption: ReservationOption, solution: Solution): ResourcePlanning[] {

        const plannings: ResourcePlanning[] = []

        const refDate = reservationOption.date

        for (const solItem of solution.items) {

            const requestItem = solItem.request

            const startDate = dateFns.addSeconds(refDate, requestItem.offset.seconds)
            const endDate = dateFns.addSeconds(startDate, requestItem.duration.seconds)

            const productInfo = new PlanningProductInfo(requestItem.product.name)
            const contactInfo = new PlanningContactInfo()
            if (order.contact) {
                contactInfo.fst = order.contact.first
                contactInfo.lst = order.contact.last
            }


            /** Sometime we don't allocate the individual resource, but we allocate the resourcegroup  */
            let groupAlloc = requestItem.productResource.groupAlloc && requestItem.productResource.resource.isGroup
            let resourceGroup = requestItem.productResource.resource

            for (let i = 0; i < requestItem.qty; i++) {

                const resource = solItem.resources[i]

                const resPlan = new ResourcePlanning()

                resPlan.branchId = order.branchId
                resPlan.start = DateHelper.yyyyMMddhhmmss(startDate)
                resPlan.end = DateHelper.yyyyMMddhhmmss(endDate)

                let resourceInfo = new PlanningResourceInfo(resource.name, resource.type)

                if (groupAlloc) {
                    resPlan.resourceGroupId = resourceGroup.id
                    resPlan.resourceGroup = resourceGroup
                    resourceInfo = new PlanningResourceInfo(resourceGroup.name, resource.type)
                }
                else {
                    resPlan.resourceId = resource.id
                    resPlan.resource = resource
                }

                /** info will be stored as json inside resourcePlanning */
                const info = new PlanningInfo(productInfo, contactInfo, resourceInfo)

                resPlan.info = info

                resPlan.orderId = order.id
                resPlan.orderLineId = requestItem.orderLine.id
                resPlan.prep = requestItem.productResource.prep
                resPlan.overlap = requestItem.productResource.prepOverlap


                plannings.push(resPlan)

            }


            for (const resource of solItem.resources) {

            }
        }

        return plannings
    }


    async calculateDeposit(order: Order): Promise<number> {

        if (!order || !order.hasLines())
            return 0


        let branch = order.branch

        if (!branch) {

            if (!order.branchId)
                throw new Error('order.branchId not specified')

            branch = await this.alteaDb.getBranch(order.branchId)
        }

        if (!branch)
            throw new Error('branch not found for order!')

        const defaultDepositPct = branch.depositPct ?? 0

        let deposit = 0

        for (let line of order.lines) {

            let depositPct = line?.product?.depositPct ?? defaultDepositPct

            if (depositPct == 0)
                continue

            depositPct = depositPct / 100

            let depositValue = line.incl * depositPct
            deposit += depositValue
        }

        return deposit

    }



    async cancelExpiredDeposistsOld() {

        const orders = await this.alteaDb.getExpiredDepositOrders()

        console.warn(orders)

        const branchIds = _.uniqBy(orders, 'branchId').map(o => o.branchId)

        const templates = await this.alteaDb.getTemplatesForBranches(branchIds, TemplateCode.resv_no_deposit_cancel)
        const branches = await this.alteaDb.getBranches(branchIds)

        for (let branch of branches) {

            const branchOrders = orders.filter(o => o.branchId == branch.id)
            const branchTemplates = templates.filter(t => t.branchId == branch.id)

            if (!Array.isArray(branchTemplates) || branchTemplates.length == 0)
                continue

            for (let order of branchOrders) {


                for (let template of branchTemplates) {

                    //  const msg = await this.taskHub.MessagingTasks.sendEmailMessage(template, order, branch, true)

                    //  console.warn(msg)

                }



                order.state = OrderState.cancelled
                order.m.setDirty('state')

                this.alteaDb.saveOrder(order)

            }


        }


    }




}