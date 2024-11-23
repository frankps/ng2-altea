/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ArrayHelper, DateHelper, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, ResourceAvailability, PossibleSlots, Organisation, ResourceAvailability2, ResourcePlanning, ReservationOptionSet } from 'ts-altea-model'
import { Observable } from 'rxjs'
import { AlteaDb } from '../../general/altea-db'
import { IDb } from '../../interfaces/i-db'
import { CreateResourceRequest } from './create-resource-request'
import { CreateAvailabilityContext } from './create-availability-context'
import { SlotFinder } from './slot-finder'
import { ResourceRequestOptimizer } from './resource-request-optimizer'
import { SolutionPicker } from './solution-picker'
import { DetermineReservationOptions } from './determine-reservation-options'
import * as dateFns from 'date-fns'
import { OrderMgmtService } from 'ts-altea-logic'

export class AvailabilityService {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    async testApi(): Promise<ApiResult<Organisation>> {

        return this.alteaDb.testApi()

    }

    async process(availabilityRequest: AvailabilityRequest): Promise<AvailabilityResponse> {

        console.error('OrderGetPossibleDates.process()', availabilityRequest)


        const order = availabilityRequest.order!

        const response = new AvailabilityResponse()

        const requestDate = new Date()

        //const schedule = await this.alteaDb.scheduleGetDefault(order.branchId!)

        /** Create Order Context
         *  ____________________
         *  
         *  Fetch all necessary data (productResources, resourcess, ...) in order to query availability  
         */

        //to do: check that resourceRoles are fetched => create an order with resource roles inside

        const createAvailabilityContext = new CreateAvailabilityContext(this.alteaDb)
        const availabilityCtx = await createAvailabilityContext.create(availabilityRequest)
        if (availabilityRequest.debug) response.debug.ctx = availabilityCtx

        /**
         *  Calculate the final availability of all the resources based on all the data previously fetched (availability context)
         */

        /*         const availability = new ResourceAvailability(availabilityCtx)
                if (availabilityRequest.debug) response.debug.availability = availability */

        const availability2 = new ResourceAvailability2(availabilityCtx)
        if (availabilityRequest.debug) response.debug.availability = availability2

        /** Create Resource Request
         *  _______________________
         *  
         *  Translate an order (with orderlines & products) into a resource request (which resources & when needed)  
         */

        const createResourceRequest = new CreateResourceRequest(this.alteaDb)
        const initialResourceRequests = createResourceRequest.create(availabilityCtx)
        if (availabilityRequest.debug) response.debug.resourceRequests.push(...initialResourceRequests)


        // const noGroupsResourceRequests = ResourceRequestOptimizer.I.replaceResourceGroupsByChildren(...initialResourceRequests)
        // if (availabilityRequest.debug) response.debug.resourceRequests.push(...noGroupsResourceRequests)


        /** If an order contains multiple treatments for the same customer, then we will try to allocate same resources (staff & room) for this customer.  */
        /*
                const optimizedRequests = ResourceRequestOptimizer.I.optimize(...initialResourceRequests)
                if (availabilityRequest.debug) response.debug.resourceRequests.push(...optimizedRequests)
        */


        /** Look for possibilities: first we try to find solutions for the optimized resource request,
         *  if no solutions found, we try the original resourceRequest
         * 
         */


        response.solutionSet = SlotFinder.I.findSlots(availability2, availabilityCtx, ...initialResourceRequests)

        // response.solutionSet = SlotFinder.I.findSlots(availability, availabilityCtx, ...optimizedRequests)


        response.optionSet = DetermineReservationOptions.I.getAllReservationOptions(response.solutionSet)

        console.error(response.optionSet)

        this.doPricing(availabilityRequest, response.optionSet)

        return response
    }


    /**
     * 
     * @param availabilityRequest 
     * @param optionSet 
     * @returns 
     */
    doPricing(availabilityRequest: AvailabilityRequest, optionSet: ReservationOptionSet) {


        let orderMgmtSvc = new OrderMgmtService(this.alteaDb)

        // availabilityRequest.order.getLine

        let order = availabilityRequest.order

        let specialPriceLines = order.getOrderLinesWithSpecialPricing()

        if (ArrayHelper.IsEmpty(specialPriceLines))
            return

        for (let option of optionSet.options) {

            if (ArrayHelper.IsEmpty(option.solutions))
                continue

            let solution = option.solutions[0]

            //let startDate = option.date
            //let orderSpecialPrice = 0

            order.clearAllPriceChanges()
            order.startDate = option.date
            orderMgmtSvc.doOrderPriceChanges(order)
            order.calculateAll()

            /*
                        for (let line of order.lines) {
            
                            let unitPrice = line.unit
            
                            if (line.hasSpecialPrices()) {
                                
                            }
                                unitPrice = line.calculateUnitPrice(startDate, order.cre)
            
                            let lineSpecialPrice = line.qty * unitPrice
            
                            orderSpecialPrice += lineSpecialPrice
                        }*/

            option.price = order.incl
        }


    }



}