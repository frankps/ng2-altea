/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ArrayHelper, DateHelper, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, PossibleSlots, Organisation, ResourceAvailability2, ResourcePlanning, ReservationOptionSet, SolutionItem, OrderLineOptionValue, ExcludedProducts, BranchModeRange } from 'ts-altea-model'
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

    checkScheduleLimitations(availabilityRequest: AvailabilityRequest, ctx: AvailabilityContext, response: AvailabilityResponse): boolean {

        const branchModeRanges = ctx.getBranchModeRanges(ctx.request.getDateRange())

        for (let branchModeRange of branchModeRanges) {

            const excludedProducts = this.checkExcludedProducts(branchModeRange, availabilityRequest, ctx)

            if (excludedProducts.hasProducts()) {
                console.error('Excluded products found', excludedProducts)
                response.informCustomer('products_not_available', {
                    products: excludedProducts.getProductNames(),
                    period: excludedProducts.dateRange.toString('dd/MM')
                })
                return false
            }


        }

        return true
       // const excludedProducts = this.checkExcludedProducts(availabilityRequest, availabilityCtx)




    }


    checkExcludedProducts(branchModeRange: BranchModeRange, availabilityRequest: AvailabilityRequest, ctx: AvailabilityContext): ExcludedProducts {

/*         const branchModeRanges = ctx.getBranchModeRanges(ctx.request.getDateRange())


        for (let branchModeRange of branchModeRanges) {



        }

        let schedule = branchModeRange.schedule
 */

        let schedule = branchModeRange.schedule

        if (ArrayHelper.IsEmpty(schedule.exclProds))
            return ExcludedProducts.empty

        let exclProds = schedule.exclProds
        let exclProdIds = exclProds.map(p => p.id)

        let products = availabilityRequest.order?.getProducts()


        let excludedProducts = products.filter(p => exclProdIds.includes(p.id))


        if (ArrayHelper.NotEmpty(excludedProducts)) {

            /* get the full date range when these products are not available (to show to user)
            remark: branch mode range is just the search range (just 1 day) 
            */
            let planning = ctx.resourcePlannings.filterByScheduleDate(schedule.id, branchModeRange.from)
            let dateRange = planning.toDateRange()

            return new ExcludedProducts(schedule, excludedProducts, dateRange)
        }



        return ExcludedProducts.empty
    }

    async process(availabilityRequest: AvailabilityRequest): Promise<AvailabilityResponse> {

        //        availabilityRequest.to


        /*         let nowNum = DateHelper.yyyyMMddhhmmss()
        
                if (availabilityRequest.from < nowNum)
                    availabilityRequest.from = nowNum */

        console.error('OrderGetPossibleDates.process()', availabilityRequest)


        const order = availabilityRequest.order! //.clone()

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


        const preChecksOk = this.checkScheduleLimitations(availabilityRequest, availabilityCtx, response)

        if (!preChecksOk)
            return response

/*
        const excludedProducts = this.checkExcludedProducts(availabilityRequest, availabilityCtx)

        if (excludedProducts.hasProducts()) {
            console.error('Excluded products found', excludedProducts)
            response.informCustomer('products_not_available', {
                products: excludedProducts.getProductNames(),
                period: excludedProducts.dateRange.toString('dd/MM')
            })
            return response
        }
*/
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

        var productWellnessId = "31eaebbc-af39-4411-a997-f2f286c58a9d"
        var wellnessDurationOptionId = "bf80e7f0-5fdd-4c5d-9b51-1d73aaef79ee"

        let orderMgmtSvc = new OrderMgmtService(this.alteaDb)

        // availabilityRequest.order.getLine

        let order = availabilityRequest.order

        let specialPriceLines = order.getOrderLinesWithSpecialPricing()

        let differentFromRequest = false

        if (optionSet.solutionSet)
            differentFromRequest = optionSet.solutionSet.hasSolutionsDifferentFromRequest()

        if (ArrayHelper.IsEmpty(specialPriceLines) && !differentFromRequest)
            return

        for (let option of optionSet.options) {

            let lineOption = null
            let lineOptionOrigValue = null


            if (ArrayHelper.IsEmpty(option.solutions))
                continue

            let solution = option.solutions[0]

            //let startDate = option.date
            //let orderSpecialPrice = 0

            if (solution.differentFromRequest) {


                let items: SolutionItem[] = solution.itemsDifferentFromRequest()

                for (let item of items) {

                    let product = item.request.product

                    let productId = product.id
                    let durationOptions = product?.options.filter(o => o.hasDuration && o.addDur)


                    for (let durationOption of durationOptions) {

                        if (durationOption.id == wellnessDurationOptionId) {

                            lineOption = order.getLineOption(productId, durationOption.id)

                            if (lineOption.hasValues()) {
                                lineOptionOrigValue = lineOption.values[0]

                                let hoursDifference = solution.difference.hours()
                                let newValueInHours = lineOptionOrigValue.val + hoursDifference

                                let newProductOptionValue = durationOption.values.find(v => v.value == newValueInHours)
                                let newOrderLineOptionValue = new OrderLineOptionValue(newProductOptionValue)

                                lineOption.values[0] = newOrderLineOptionValue
                            }
                        }
                    }
                }

            }

            //order.clone()

            order.clearAllPriceChanges()
            order.startDate = option.date
            orderMgmtSvc.doOrderPriceChanges(order)
            order.calculateAll()
            option.price = order.incl

            if (lineOption && lineOptionOrigValue) {
                option.order = order.clone()
                lineOption.values[0] = lineOptionOrigValue
            }

            order.clearAllPriceChanges()
        }
    }



}