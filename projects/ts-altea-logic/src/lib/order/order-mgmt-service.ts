/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, DateHelper, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, ResourceAvailability, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, Reminder } from 'ts-altea-model'
import { Observable } from 'rxjs'
import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import { CreateResourceRequest } from './reservation/create-resource-request'
import { CreateAvailabilityContext } from './reservation/create-availability-context'
import { SlotFinder } from './reservation/slot-finder'
import { ResourceRequestOptimizer, ResourceSet } from './reservation/resource-request-optimizer'
import { SolutionPicker } from './reservation/solution-picker'
import { DetermineReservationOptions } from './reservation/determine-reservation-options'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"


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




    async changeState(order: Order, newState: OrderState): Promise<ApiResult<Order>> {  //  : Promise<ApiResult<Order>>

        order.state = newState
        order.m.setDirty('state')

        switch (newState) {
            case OrderState.waitDeposit:
                order.depositBy = DateHelper.yyyyMMddhhmmss()
                order.m.setDirty('depositBy')
        }

        console.warn(order)

        const result = await this.alteaDb.saveOrder(order)

        return result
        /*
        const templates = await this.alteaDb.getTemplates(order.branchId, newState)

        console.warn(templates)

        for (let template of templates) {

            const msg = template.mergeWithOrder(order)
            msg.from = 'info@aquasense.be'
            msg.to = ['frank@dvit.eu']

            console.error(msg)

            const sendRes = await this.alteaDb.db.sendMessage$(msg)
            console.warn(sendRes)

        }*/

    }






    /**
     * Saves the order, calculates & saves the resource plannings based on previously determined calculated solution
     * @param order 
     * @param reservationOption 
     * @param solution 
     * @returns 
     */
    async confirmOrder(order: Order, reservationOption: ReservationOption, solution: Solution): Promise<Order | undefined> {

        order.start = reservationOption.dateNum

        // order.lines = undefined

        /** Save order */

        const orderApiResult = await this.alteaDb.saveOrder(order)

        if (orderApiResult.status != ApiStatus.ok) {
            console.error(orderApiResult)
            return undefined
        }

        const plannings = this.createResourcePlanningsForNewOrder(order, reservationOption, solution)

        console.info(plannings)

        const planningResult = await this.alteaDb.saveResourcePlannings(plannings)

        return orderApiResult.object

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


            for (const resource of solItem.resources) {

                const resPlan = new ResourcePlanning()

                resPlan.branchId = order.branchId
                resPlan.start = DateHelper.yyyyMMddhhmmss(startDate)
                resPlan.end = DateHelper.yyyyMMddhhmmss(endDate)

                const resourceInfo = new PlanningResourceInfo(resource.name, resource.type)
                /** info will be stored as json inside resourcePlanning */
                const info = new PlanningInfo(productInfo, contactInfo, resourceInfo)

                resPlan.info = info


                resPlan.resourceId = resource.id
                resPlan.orderLineId = requestItem.orderLine.id


                plannings.push(resPlan)
            }
        }

        return plannings
    }


}