/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, ArrayHelper, DateHelper, DbQuery, DbQueryBaseTyped, DbQueryTyped, DeleteManyResult, QueryOperator } from 'ts-common'
import { Order, Gift, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MsgInfo, ConfirmOrderResponse, OrderSource, TemplateCode, OrderCancel, OrderCancelBy, CustomerCancelReasons, PaymentType, Payment, ResourceRequestItem, Resource, DateRange, OrderLine, SolutionItem, PriceMode, PriceChange, PriceChangeType } from 'ts-altea-model'
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
import { GiftMessaging } from './messaging/gift-messaging'



export class AddPaymentToOrderParams {
    orderId: string
    type: PaymentType
    amount: number
    provId?: string
}


export class OrderDeleteResult {
    ok: boolean = true

    messages: string[] = []

    error(msg: string) {
        this.ok = false
        this.messages.push(msg)
    }
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

    async deleteOrderLinesForOrder(orderId: string): Promise<ApiResult<DeleteManyResult>> {
        const qry = new DbQueryBaseTyped<OrderLine>('orderLine', OrderLine)
        qry.and('orderId', QueryOperator.equals, orderId)
        var res = this.alteaDb.db.deleteMany$(qry)
        return res
    }

    async deletePaymentsForOrder(orderId: string): Promise<ApiResult<DeleteManyResult>> {
        const qry = new DbQueryBaseTyped<Payment>('payment', Payment)
        qry.and('orderId', QueryOperator.equals, orderId)
        var res = this.alteaDb.db.deleteMany$(qry)
        return res
    }


    async deleteGiftForOrder(orderId: string): Promise<ApiResult<DeleteManyResult>> {
        const qry = new DbQueryBaseTyped<Gift>('gift', Gift)
        qry.and('orderId', QueryOperator.equals, orderId)
        var res = this.alteaDb.db.deleteMany$(qry)
        return res
    }

    async deletePlanningsForOrder(orderId: string): Promise<ApiResult<DeleteManyResult>> {
        const qry = new DbQueryBaseTyped<ResourcePlanning>('resourcePlanning', ResourcePlanning)
        qry.and('orderId', QueryOperator.equals, orderId)
        var res = this.alteaDb.db.deleteMany$(qry)
        return res
    }

    async deleteOrder(orderId: string): Promise<OrderDeleteResult> {  // ApiResult<Order>

        const order = await this.alteaDb.getOrder(orderId, ...Order.defaultInclude)

        let orderDeleteResult = new OrderDeleteResult()

        //let allOk = true

        if (order.gift) {
            let res = await this.deleteGiftForOrder(orderId)

            if (res.notOk) {
                orderDeleteResult.error(`Problem deleting gifts: ${res.message}`)
                return orderDeleteResult
            }


        }

        if (ArrayHelper.NotEmpty(order.lines)) {
            let res = await this.deleteOrderLinesForOrder(orderId)

            if (res.notOk) {
                orderDeleteResult.error(`Problem deleting order lines: ${res.message}`)
                return orderDeleteResult
            }
        }

        if (ArrayHelper.NotEmpty(order.payments)) {
            let res = await this.deletePaymentsForOrder(orderId)

            if (res.notOk) {
                orderDeleteResult.error(`Problem deleting payments: ${res.message}`)
                return orderDeleteResult
            }

        }

        if (ArrayHelper.NotEmpty(order.planning)) {
            let res = await this.deletePlanningsForOrder(orderId)

            if (res.notOk) {
                orderDeleteResult.error(`Problem deleting plannings: ${res.message}`)
                return orderDeleteResult
            }
        }

        const qry = new DbQueryBaseTyped<Order>('order', Order)
        qry.and('id', QueryOperator.equals, orderId)
        var res = await this.alteaDb.db.deleteMany$(qry)

        if (res.notOk) {
            orderDeleteResult.error(`Problem deleting order: ${res.message}`)
        }

        return orderDeleteResult

    }


    async addPaymentToOrder(orderId: string, type: PaymentType, amount: number, provId?: string): Promise<ApiResult<Order>> {


        // 'lines:orderBy=idx.product', 'contact'
        let order = await this.alteaDb.getOrder(orderId, ...Order.defaultInclude)  // , 'lines:orderBy=idx.product', 'contact', 'payments:orderBy=idx'

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

        let result = await this.alteaDb.saveOrder(order)

        order = result.object

        if (!result.isOk)
            console.error(result.message)

        /** we had Stripe payments coming in on cancelled (=timed out) orders => fix somewhere else */
        if (order.state != OrderState.cancelled) {
            console.debug('Starting change state')
            result = await this.changeState(order)
        }

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



        /** we remove the lock (used by client to be able to plan again on same hours as previously created temp orders) */
        if (newState != OrderState.creation && newState != OrderState.created) {
            order.lock = ''
            order.m.setDirty('lock')
        }

        switch (newState) {
            case OrderState.created:

                /** if order was created internally (Point Of Sale) and still a deposit to pay */
                if (!order.gift && order.src == OrderSource.pos && order.depo && order.deposit > 0 && order.paid < order.deposit) {

                    // then we calculate depoBy date
                    const now = new Date()
                    const depoByDate = dateFns.addMinutes(now, order.depoMins)
                    order.depoBy = DateHelper.yyyyMMddhhmmss(depoByDate)
                    order.m.setDirty('depoBy')

                    order.lock = ''
                    order.m.setDirty('lock')

                    await msgSvc.depositMessaging(order, true)
                    order.state = OrderState.waitDeposit


                } else {

                    let result = await this.changeState(order, OrderState.confirmed)
                    return result

                }
                break

            case OrderState.waitDeposit:
                order.depoBy = DateHelper.yyyyMMddhhmmss()
                order.m.setDirty('depoBy')
                break

            case OrderState.confirmed:

                order.lock = ''
                order.m.setDirty('lock')

                let hasServices = ArrayHelper.NotEmpty(order.planning) // order.hasServices()

                if (order.gift) {
                    const giftMsg = new GiftMessaging(this.alteaDb) // GiftMes(this.alteaDb)
                    await giftMsg.fulfillGiftOrder(order)
                } else if (hasServices) {
                    var res = await msgSvc.confirmationMessaging(order)
                }

                console.warn(res)

                break
        }

        const result = await this.alteaDb.saveOrder(order)
        console.warn(order)

        return result

    }






    /**
     * Saves the order, calculates & saves the resource plannings based on previously determined calculated solution
     * @param order 
     * @param reservationOption 
     * @param solution   only filled in when reservationOption is coming from solution (not a forced/custom date)
     * @param availabilityResponse: previous response (some calculations will be re-used in case of forcing a certain date)
     * @returns 
     */
    async confirmOrder(order: Order, reservationOption: ReservationOption, solution: Solution, availabilityResponse: AvailabilityResponse): Promise<ApiResult<Order>> {   // ConfirmOrderResponse | undefined



        order.start = reservationOption.dateNum
        order.m.setDirty('start')



        const response = new ConfirmOrderResponse()

        if (solution)
            response.plannings = this.createResourcePlanningsForNewOrder(order, reservationOption, solution)
        else
            response.plannings = this.forceDateTime(order, reservationOption.date, availabilityResponse)


        console.info(response.plannings)

        // return new ApiResult(order)

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

            const newPlannings = this.requestItemToPlannings(requestItem, refDate, order, solItem.resources, solution)
            plannings.push(...newPlannings)

            continue

            const startDate = dateFns.addSeconds(refDate, requestItem.offsetInSeconds(solution))
            const endDate = dateFns.addSeconds(startDate, requestItem.durationInSeconds(solution))

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


    /**
     * Sometimes we will not use previously calculated options (from solutions),
     * instead we force a certain date
     * 
     * In this case we re-use previously calculated response
     * 
     * @param response a previously generated response: in order to re-use
     */
    forceDateTime(order: Order, refDate: Date, response: AvailabilityResponse): ResourcePlanning[] {



        const plannings: ResourcePlanning[] = []

        let resourceRequest = response.debug.resourceRequests[0]
        let availability = response.debug.availability

        /* we maintain a solution for this custom time-slot => to avoid usage of same resources at the same time (when calling availability.getAvailableResourcesInRange(...))
        Normally solutions are created first, and from there we derive possible start dates

        Here we have a start date, and we force a solution
        */
        let solution = new Solution(resourceRequest)

        for (let requestItem of resourceRequest.items) {

            const startDate = dateFns.addSeconds(refDate, requestItem.offsetInSeconds(solution))
            const endDate = dateFns.addSeconds(startDate, requestItem.durationInSeconds(solution))
            let range = new DateRange(startDate, endDate)

            //let resources = requestItem.resources

            //availability.getAvailabilityOfResourcesInRange(resources, )

            let result = availability.getAvailableResourcesInRange(requestItem.resources, range, requestItem, solution, true, true)
            let resources = result.result

            if (!resources)
                resources = []

            /*
                if we couldn't find available resources, we just add some resources (probably already occupied)  --> too be investigated !!!
            */
            if (resources.length < requestItem.qty) {

                var j = 0
                for (let i = resources.length; i < requestItem.qty; i++) {
                    resources.push(requestItem.resources[j++])
                }
            }

            let durationFixed = false
            solution.add(new SolutionItem(solution, requestItem, range, true, durationFixed, ...resources))

            const newPlannings = this.requestItemToPlannings(requestItem, refDate, order, resources, solution)
            plannings.push(...newPlannings)

        }


        return plannings


    }

    private requestItemToPlannings(requestItem: ResourceRequestItem, refDate: Date, order: Order, resources: Resource[], solution: Solution): ResourcePlanning[] {
        const plannings: ResourcePlanning[] = []

        const startDate = dateFns.addSeconds(refDate, requestItem.offsetInSeconds(solution))
        const endDate = dateFns.addSeconds(startDate, requestItem.durationInSeconds(solution))

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

            const resource = resources[i]

            if (!resource) {
                console.error(`Resource not found for requestItem ${requestItem}`)
                continue
            }
                

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


    doOrderPriceChanges(order: Order) {

        for (let line of order.lines)
            this.doOrderLinePriceChanges(order, line)

    }

    inHighPeriod(date: Date) {

        if (!date)
            return false

        let specialDates = []   // 20241224, 20241225, 20241231, 20250101

        let dateNum = DateHelper.yyyyMMdd(date)

        if (specialDates.indexOf(dateNum) >= 0)
            return true

        let specialRanges = [[20241224, 20250101], [20250212, 20250214]]

        for (let range of specialRanges) {
              if (dateNum >= range[0] && dateNum <= range[1])
                return true
        }

        return false
    }

    doOrderLinePriceChanges(order: Order, orderLine: OrderLine) {

        let now = new Date()
        let product = orderLine.product

        if (ArrayHelper.IsEmpty(product.prices))
            return 0

        let prices = _.sortBy(product.prices, ['idx'], ['asc'])

        if (!orderLine.pc)
            orderLine.pc = []

        let specialPricing = 0

        let startDate = order?.startDate

        let creationDate = order?.cre

        if (!creationDate)
            creationDate = new Date()

        let day = -1
        let skipDateChecks = false

        if (startDate)
            day = dateFns.getDay(startDate)
        else
            skipDateChecks = true  // because there is no date available

        if (ArrayHelper.IsEmpty(product.prices))
            return 0

        for (let price of product.prices) {

            
            if (!price.on)
                continue

            if (orderLine.hasPriceChange(price.id))
                continue // price already applied

            if (price.giftOpt)
                continue

            if (price.start) {
                if (creationDate < price.startDate)
                    continue
            }

            if (price.isDay) {
                if (skipDateChecks || !price.days[day])
                    continue
            }

            if (price.isTime) {

                if (skipDateChecks)
                    continue

                let from = DateHelper.getDateAtTime(price.from, startDate)
                let to = DateHelper.getDateAtTime(price.to, startDate)

                // if startdate outside interval
                if (startDate < from || startDate >= to)
                    continue
            }

            if (price.hasPeriods) {

                if (skipDateChecks)
                    continue

                if (!this.inHighPeriod(startDate))
                    continue

            }

            if (price?.skipLast > 0) {

                if (skipDateChecks)
                    continue

                const skipAfter = dateFns.subHours(startDate, price.skipLast)

                if (skipAfter <= now )  // && now < startDate
                    continue


            }

            switch (price.mode) {
                case PriceMode.add:

                    let priceChange = new PriceChange()
                    priceChange.tp = PriceChangeType.price
                    priceChange.val = price.value
                    priceChange.info = price.title
                    priceChange.id = price.id
                    priceChange.pct = false

                    orderLine.pc.push(priceChange)

                    break
            }

            if (price.skip)
                break
        }

        return specialPricing


    }





}