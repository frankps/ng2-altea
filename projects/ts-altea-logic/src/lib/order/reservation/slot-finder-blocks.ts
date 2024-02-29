/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AvailabilityContext, DateRange, DateRangeSet, PlanningBlockSeries, PlanningMode, PossibleSlots, Product, Resource, ResourceAvailability, ResourceAvailability2, ResourceRequest, ResourceRequestItem, ResourceType, SlotInfo, Solution, SolutionItem, SolutionSet, TimeSpan } from "ts-altea-model";
import * as _ from "lodash"
import { ResourceRequestOptimizer } from "./resource-request-optimizer";
import { scheduled } from "rxjs";
import * as dateFns from 'date-fns'


export enum SlotSearchDirection {
    forward,
    backward
}

export class SlotFinderBlocks {


    static _I: SlotFinderBlocks = new SlotFinderBlocks()

    /** Returns instance of this class */
    static get I(): SlotFinderBlocks {
        return SlotFinderBlocks._I
    }


    createInitialSolutions(availability: ResourceAvailability2, ctx: AvailabilityContext, resourceRequest: ResourceRequest): SolutionSet {

        /*
        Work in progress: just added labels START & END to date ranges

        */

        const solutionSet = new SolutionSet()

        const firstRequestItem = resourceRequest.items[0]
        const product = firstRequestItem.product

        // most likely there is only 1 resource, example: Wellness
        for (const resource of firstRequestItem.resources) {

            const availabilities = availability.getAvailabilitiesForResource(resource, firstRequestItem.duration)

            console.warn(availabilities)

            for (const range of availabilities.ranges) {

                const availableRange = range.clone()
                let possibleDateRanges = DateRangeSet.empty

                let scheduleIsEmpty = range.containsLabels('START', 'END')

                // if the range has no occupations yet
                if (scheduleIsEmpty) {
                    possibleDateRanges = this.getFullDayStartDates(product, range, ctx)
                    const solutions = possibleDateRanges.toSolutions(resourceRequest, firstRequestItem, true, resource)
                    solutionSet.add(...solutions)

                } else {
                    const solutions = this.findSlotsInRange(resource, range, firstRequestItem, resourceRequest, availability, ctx)
                    solutionSet.add(...solutions)
                }


            }


        }

        return solutionSet
    }


    findSlotsInRange(resource: Resource, availableRange: DateRange, resReqItem: ResourceRequestItem, resourceRequest: ResourceRequest, availability: ResourceAvailability2, ctx: AvailabilityContext) {

        //const solutionSet = new SolutionSet()

        const solutions: Solution[] = []
        let currentSolution: Solution

        let searchDirection = SlotSearchDirection.forward

        /*
        There can exist multiple resource requests for same resource, example (in chronological order):
            Wellness preparation: 15min     (Preparation, Overlap allowed)
            Wellness session: 2h
            Wellness cleanup: 30min         (Preparation, Overlap allowed)

        */
        let requestItemsSameResource = resourceRequest.getItemsForResource(resource.id)


        const firstRequestItem = requestItemsSameResource[0]

        let offsetZeroDate: Date


        if (firstRequestItem.isPrepTime && firstRequestItem.prepOverlap) {
 

            let solutionItem = this.handlePreparationRequestItem(resource, firstRequestItem, availableRange, availability, ctx)


           // set the reference date for this solution
           offsetZeroDate = dateFns.addSeconds(solutionItem.dateRange.from, -firstRequestItem.offset.seconds)

            //  solutionSet.add(new Solution(solutionItem))
            currentSolution = new Solution(solutionItem)
            solutions.push(currentSolution)

            //firstRequestItem.isProcessed = true
        }


        // reminder: we work inside an availableRange

        for (let i = 1; i < requestItemsSameResource.length; i++) {

            let requestItem = requestItemsSameResource[i]
            let solutionItem = this.handleBasicRequestItem(resource, requestItem, offsetZeroDate, availableRange)

            currentSolution.add(solutionItem)

            if (!solutionItem.valid) {
                currentSolution.valid = false
                break  // we don't continue with current solution
            }
                
        }


        console.error(requestItemsSameResource)

        // we mark all request items as processed
        requestItemsSameResource.forEach(requestItem => requestItem.isProcessed = true)

        return solutions

    }

    handlePreparationRequestItem(resource: Resource, firstRequestItem: ResourceRequestItem, availableRange: DateRange, availability: ResourceAvailability2, ctx: AvailabilityContext): SolutionItem {
           // this is a preparation block that can overlap with existing (preparations) => try to find one
           let existingPrepBlock = availability.getPreparationBlockJustBefore(resource.id, availableRange.from)

           let prepFrom: Date, prepTo: Date


           console.log(existingPrepBlock)

           if (existingPrepBlock) {

               if (existingPrepBlock.seconds() >= firstRequestItem.seconds()) {
                   // the requested time block fits into the existing one
                   prepTo = existingPrepBlock.to   // same as availableRange.from
                   prepFrom = dateFns.addSeconds(prepTo, -firstRequestItem.seconds())
               } else {
                   prepFrom = existingPrepBlock.from
                   prepTo = dateFns.addSeconds(prepFrom, firstRequestItem.seconds())
               }
           } else {

               // there is no existing preparation block where we can overlap with => create inside the available range
               prepFrom = availableRange.from

               if (availableRange.containsFromLabel('START')) {
                   // get the current schedule in order to see if preparations can be done outside schedule
                   let schedule = ctx.getScheduleOnDate(resource.id, prepFrom)

                   if (!schedule)
                       throw new Error(`No schedule found`)

                   // check if preparations can be done outside schedule
                   if (!schedule.prepIncl)
                       prepFrom = dateFns.addSeconds(availableRange.from, -firstRequestItem.seconds())
               }

               prepTo = dateFns.addSeconds(prepFrom, firstRequestItem.seconds())
           }

           let newPreparationRange = new DateRange(prepFrom, prepTo)


           let solutionItem = new SolutionItem(firstRequestItem, newPreparationRange, true, resource)

           return solutionItem
    }



    handleBasicRequestItem(resource: Resource, requestItem: ResourceRequestItem, offsetZeroDate: Date, availableRange: DateRange): SolutionItem {

        let requestFrom = dateFns.addSeconds(offsetZeroDate, requestItem.offset.seconds)
        let requestTo = dateFns.addSeconds(requestFrom, requestItem.duration.seconds)

        let requestRange = new DateRange(requestFrom, requestTo)

        // if requestRange is still within available range: then all is still ok

        let solutionItem = new SolutionItem(requestItem, requestRange, true, resource)
        solutionItem.valid = requestRange.isInsideOf(availableRange)

        if (!solutionItem.valid) {
            solutionItem.addNote(`${requestRange.toString()} not in available range ${availableRange.toString()}`)
        }

        return solutionItem
    }



    findSlots(resReqItem: ResourceRequestItem, inDateRange: DateRange, ctx: AvailabilityContext, availability: ResourceAvailability2): DateRangeSet {

        if (!Array.isArray(resReqItem.resources) || resReqItem.resources.length != 1) {

            throw new Error(`SlotFinderBlocks`)
        }


        // let resource = resReqItem.resources[0]

        let availabilities = availability.getAvailabilityOfResourcesInRange(resReqItem.resources, inDateRange, resReqItem.duration)
        console.error(availabilities)

        const product = resReqItem.product

        // then we get initial slots from product.plan

        const dateRanges = this.getFullDayStartDates(product, inDateRange, ctx)



        /*
        if (this.isFullDay(inDateRange, ctx)) {   // this means there are no reservations yet 

        } else {
            throw new Error('Not implemented yet!')
        }*/

        return dateRanges


    }

    getFullDayStartDates(product: Product, dateRange: DateRange, ctx: AvailabilityContext): DateRangeSet {

        /** Mostly there is only 1 branch schedule (the default operational mode) active in a given dateRange (can be 1 day for instance),
         *  but exceptionally there can be more branch schedules in a given period (example: normal operations, later followed by holiday period) 
         * 
         *  We need the schedules to determine the block series (just because these can vary by schedule)
         * 
         **/
        const schedules = ctx.getBranchSchedules(dateRange)

        let resultBlocks = new DateRangeSet()

        for (let i = 0; i < schedules.byDate.length - 1; i++) {  // -1 because last item is alwas dateRange.to
            const schedule = schedules.byDate[i]
            const nextSchedule = schedules.byDate[i + 1]

            const dateRangeSameSchedule = new DateRange(schedule.start, nextSchedule.start)

            //  ctx.resourcePlannings.

            // get definitions for block series for current schedule (= operational mode)
            const blockSeries = product.getBlockSeries(schedule.schedule.id!)

            if (Array.isArray(blockSeries)) {
                // convert to actual dates
                const dateRangeSet = this.getActualBlocks(blockSeries, dateRangeSameSchedule)
                resultBlocks = resultBlocks.add(dateRangeSet)


            }
        }

        return resultBlocks
    }

    /**
 * 
 * @param blockSeries the series definied on product.plan (when product.planMode=block)
 * @param dateRange 
 * @returns 
 */
    getActualBlocks(blockSeries: PlanningBlockSeries[], dateRange: DateRange): DateRangeSet {

        let result = new DateRangeSet()

        for (const series of blockSeries) {

            const dateRangeSet = series.makeBlocks(dateRange)
            result = result.add(dateRangeSet)

        }


        return result

    }


}