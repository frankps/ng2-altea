/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AvailabilityContext, DateRange, DateRangeSet, PlanningBlockSeries, PlanningMode, PossibleSlots, Product, Resource, ResourceAvailability, ResourceAvailability2, ResourceRequest, ResourceRequestItem, ResourceType, SlotInfo, Solution, SolutionItem, SolutionNoteLevel, SolutionSet, TimeSpan } from "ts-altea-model";
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

        let offsetRefDate: Date = availableRange.from

        let isFirstLoop = true

        // we try to find slots until we reach end of availableRange
        while (offsetRefDate < availableRange.to) {

            currentSolution = new Solution()
            currentSolution.offsetRefDate = offsetRefDate

            solutions.push(currentSolution)

            let firstRequestProcessed = false

            if (isFirstLoop && firstRequestItem.isPrepTime && firstRequestItem.prepOverlap) {

                let solutionItem = this.handlePreparationRequestItem(resource, firstRequestItem, availableRange, availability, ctx)

                // set the reference date for this solution
                offsetRefDate = dateFns.addSeconds(solutionItem.dateRange.from, -firstRequestItem.offset.seconds)
                currentSolution.offsetRefDate = offsetRefDate

                //  solutionSet.add(new Solution(solutionItem))
                currentSolution.add(solutionItem)

                firstRequestProcessed = true


                //firstRequestItem.isProcessed = true
            }

            let requestItemsToProcess = [...requestItemsSameResource]   //.splice(0, 1)

            if (firstRequestProcessed)
                requestItemsToProcess.splice(0, 1)

            this.handleBasicRequestItems(true, resource, requestItemsToProcess, offsetRefDate, availableRange, currentSolution, availability, ctx)


            isFirstLoop = false
            offsetRefDate = dateFns.addMinutes(offsetRefDate, 135)

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

    handleBasicRequestItems(searchForward: boolean, resource: Resource, requestItemsSameResource: ResourceRequestItem[], startDate: Date, availableRange: DateRange, solution: Solution
        , availability: ResourceAvailability2, ctx: AvailabilityContext) {

        for (let i = 0; i < requestItemsSameResource.length; i++) {

            let requestItem = requestItemsSameResource[i]
            let solutionItem = this.handleBasicRequestItem(searchForward, resource, requestItem, startDate, availableRange, availability, ctx)

            solution.add(solutionItem)

            if (!solutionItem.valid) {


                solution.valid = false
                break  // we don't continue with current solution
            }
        }

    }


    handleBasicRequestItem(searchForward: boolean, resource: Resource, requestItem: ResourceRequestItem, startDate: Date, availableRange: DateRange
        , availability: ResourceAvailability2, ctx: AvailabilityContext): SolutionItem {

        let requestFrom = dateFns.addSeconds(startDate, requestItem.offset.seconds)
        let requestTo = dateFns.addSeconds(requestFrom, requestItem.duration.seconds)

        let requestRange = new DateRange(requestFrom, requestTo)

        // if requestRange is still within available range: then all is still ok
        let outsideOfRange = !requestRange.isInsideOf(availableRange)

        let solutionItem = new SolutionItem(requestItem, requestRange, true, resource)


        if (outsideOfRange) {
            solutionItem.valid = false

            // then maybe check if preparation outside or overlapping with other preparation time if allowed 
            if (requestItem.isPrepTime) {

                // check if outside 
                solutionItem = this.handlePreparationRequestItem2(searchForward, resource, requestItem, requestRange, availableRange, availability, ctx)


            }


            if (!solutionItem.valid)
                solutionItem.addNote(`${requestRange.toString()} not in available range ${availableRange.toString()}`)
        }

        return solutionItem
    }

    handlePreparationRequestItem2(searchForward: boolean, resource: Resource, requestItem: ResourceRequestItem, requestRange: DateRange, availableRange: DateRange, availability: ResourceAvailability2, ctx: AvailabilityContext) {

        let solutionItem = new SolutionItem(requestItem, requestRange, true, resource)
        solutionItem.valid = false

        // check if preparations can be done outside schedule
        let schedule = ctx.getScheduleOnDate(resource.id, requestRange.from)

        if (!schedule)
            throw new Error(`No schedule found ${resource.name}`)

        if (!schedule.prepIncl) {  // meaning: preparations outside schedule are allowed

            // outsideSchedule = partially or fully outside schedule
            let outsideSchedule = !schedule.isInsideSchedule(requestRange)

            if (outsideSchedule && searchForward) {

                // 2 options: 
                //    1) requestRange is completly outside schedule 
                //    2) requestRange is partially outside schedule => investigate if part inside schedule is available!
                let rangesOutsideSchedule = schedule.outsideSchedule(requestRange)

                if (rangesOutsideSchedule.contains(requestRange)) {
                    solutionItem.valid = true
                    solutionItem.addNote(`${requestRange.toString()} is preparation time AND is completely outside schedule, but this is allowed!`, SolutionNoteLevel.info)
                } else {
                    
                    // preparation partially outside schedule

                    let rangesInsideSchedule = schedule.insideSchedule(requestRange)

                    if (availableRange.containsSet(rangesInsideSchedule)) {
                        solutionItem.valid = true
                        solutionItem.addNote(`${requestRange.toString()} is preparation time AND is partially outside schedule, but this is allowed!`, SolutionNoteLevel.info)
                    }

                }

                // check if we are outside schedule
                console.warn('NOW WE NEED TO LOOK OUTSIDE SCHEDULE')


            }


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