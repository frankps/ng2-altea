/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, ArrayHelper, DateHelper, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
import { Order, Gift, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, ResourceAvailability, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MsgInfo, ConfirmOrderResponse, OrderSource } from 'ts-altea-model'
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




    async saveOrder(order: Order): Promise<ApiResult<Order>> {

        const orderApiResult = await this.alteaDb.saveOrder(order)

        return orderApiResult
    }


    async test() {
        this.alteaDb.getOrders()
    }





    async changeState(order: Order, newState: OrderState): Promise<ApiResult<Order>> {  //  : Promise<ApiResult<Order>>

        const msgSvc = new OrderMessaging(this.alteaDb)


        order.state = newState
        order.m.setDirty('state')

        switch (newState) {
            case OrderState.created:

                /** if order was created internally (Point Of Sale) and still a deposit to pay */
                if (order.src == OrderSource.pos && order.deposit > 0 && order.paid < order.deposit) {
                    await msgSvc.depositMessaging(order, true)
                    order.state = OrderState.waitDeposit
                    order.m.setDirty('state')
                }
                break

            case OrderState.waitDeposit:
                order.depositBy = DateHelper.yyyyMMddhhmmss()
                order.m.setDirty('depositBy')
                break

            case OrderState.confirmed:

                await msgSvc.confirmationMessaging(order)
                order.state = OrderState.waitDeposit
                order.m.setDirty('state')
                break



        }

        console.warn(order)

        const result = await this.alteaDb.saveOrder(order)

        return result

    }






    /**
     * Saves the order, calculates & saves the resource plannings based on previously determined calculated solution
     * @param order 
     * @param reservationOption 
     * @param solution 
     * @returns 
     */
    async confirmOrder(order: Order, reservationOption: ReservationOption, solution: Solution): Promise<ConfirmOrderResponse | undefined> {

        order.start = reservationOption.dateNum
        order.m.setDirty('start')

        const response = new ConfirmOrderResponse()

        response.plannings = this.createResourcePlanningsForNewOrder(order, reservationOption, solution)

        console.info(response.plannings)

        const orderApiResult = await this.alteaDb.saveOrder(order)

        if (orderApiResult.status != ApiStatus.ok) {
            console.error(orderApiResult)
            return undefined
        }

        response.order = orderApiResult.object

        const planningResult = await this.alteaDb.saveResourcePlannings(response.plannings)

        return response

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



}