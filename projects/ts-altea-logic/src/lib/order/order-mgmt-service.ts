/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, DateHelper, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, ResourceAvailability, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType } from 'ts-altea-model'
import { Observable } from 'rxjs'
import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import { CreateResourceRequest } from './create-resource-request'
import { CreateAvailabilityContext } from './create-availability-context'
import { SlotFinder } from './slot-finder'
import { ResourceRequestOptimizer, ResourceSet } from './resource-request-optimizer'
import { SolutionPicker } from './solution-picker'
import { DetermineReservationOptions } from './determine-reservation-options'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"


export class OrderMgmtService {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    /*     async changeState(orderId: string, newState: OrderState) {
    
            
    
        } */


    async saveOrder(order: Order): Promise<ApiResult<Order>> {

        const orderApiResult = await this.alteaDb.saveOrder(order)

        return orderApiResult
    }


    async changeState(order: Order, newState: OrderState) {  //  : Promise<ApiResult<Order>>

        order.state = newState

        // await this.alteaDb.saveOrder(order)

        const templates = await this.alteaDb.getTemplates(order.branchId, newState)

        console.warn(templates)

        for (let template of templates) {

            const msg = this.mergeTemplate(template, order)

            console.error(msg)

            this.alteaDb


        }
    }


    mergeTemplate(template: Template, order: Order): Message {

        const message = new Message()

        message.branchId = order.branchId
        message.orderId = order.id

        const replacements = { name: "Nils", info: "baby giraffe" }

        if (template.body) {
            const hbTemplate = Handlebars.compile(template.body)
            message.body = hbTemplate(replacements)
        }

        if (template.subject) {
            const hbTemplate = Handlebars.compile(template.subject)
            message.subject = hbTemplate(replacements)
        }

        message.type = template.msgType()

        return message

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