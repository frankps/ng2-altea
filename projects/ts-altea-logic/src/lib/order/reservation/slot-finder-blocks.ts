/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AvailabilityContext, BranchSchedules, DateRange, DateRangeSet, PlanningBlockSeries, PlanningMode, PossibleSlots, Product, Resource, ResourceAvailability2, ResourceRequest, ResourceRequestItem, ResourceType, Schedule, SlotInfo, Solution, SolutionItem, SolutionNoteLevel, SolutionSet, TimeSpan } from "ts-altea-model";
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

            const availabilities = availability.getAvailabilitiesForResource(resource, firstRequestItem.duration())

            console.warn(availabilities)

            for (const availableRange of availabilities.ranges) {

                // const availableRange = range.clone()
                let possibleDateRanges = DateRangeSet.empty

                let scheduleIsEmpty = availableRange.containsLabels('START', 'END')

                let searchForward = false   // by default we work backwards to fill an availableRange

                let fromScheduleStart = availableRange.containsFromLabel('START')

                /*
                    fromScheduleStart = true => availableRange starts at beginning of schedule 

                */
                if (!fromScheduleStart)  // => there is already a booking to the left of availableRange
                    searchForward = true   // => because we want to work forward from an existing booking (to reduce empty spaces in calendar)

                /** Mostly there is only 1 branch schedule (the default operational mode) active in a given dateRange (can be 1 day for instance),
                *  but exceptionally there can be more branch schedules in a given period (example: normal operations, later followed by holiday period) 
                * 
                *  We need the schedules to determine the block series (just because these can vary by schedule)
                * 
                **/
                const schedules = ctx.getBranchSchedules(availableRange)
                let firstSchedule = schedules.byDate[0]?.schedule

                /** if planning blocks are configured, then a customer might still change the duration via a product option. But, for a certain product & schedule we might disable this (example: wellness during holiday) */
                const durationFixed = this.preconfiguredBlocksOnly(firstSchedule, product)

                // if the range has no occupations yet
                if (scheduleIsEmpty || durationFixed) {
                    possibleDateRanges = this.getFullDayStartDates(product, availableRange, ctx, schedules)


                    
                    if (!scheduleIsEmpty) {
                        // remove occupied ranges from possibleDateRanges   
                        const resourceAvailability = availability.getSetForResource(resource.id)

                        if (resourceAvailability?.unavailable) {
                           
                            possibleDateRanges = possibleDateRanges.removeOverlappingRanges(resourceAvailability.unavailable)
                        }


                        
                    }
                    
                    const solutions = possibleDateRanges.toSolutions(resourceRequest, firstRequestItem, true, durationFixed, resource)
                    solutionSet.add(...solutions)

                } else {

                    const solutions = this.findSlotsInRange(searchForward, resource, availableRange, firstRequestItem, resourceRequest, availability, ctx)
                    solutionSet.add(...solutions)
                }


            }


        }

        firstRequestItem.isProcessed = true

        return solutionSet
    }


    preconfiguredBlocksOnly(schedule: Schedule, product: Product) : boolean {

        let hifrAfwezig = 'd507d664-3d8f-4ebe-bb3b-86dcd7df6fc8'
        let wellness = '31eaebbc-af39-4411-a997-f2f286c58a9d'

        if (schedule.id == hifrAfwezig && product.id == wellness)
            return true

        return false
    }

    findSlotsInRange(searchForward: boolean, resource: Resource, availableRange: DateRange, resReqItem: ResourceRequestItem, resourceRequest: ResourceRequest, availability: ResourceAvailability2, ctx: AvailabilityContext) {

        //const solutionSet = new SolutionSet()

        const solutions: Solution[] = []
        let currentSolution: Solution

        //  let searchDirection = SlotSearchDirection.forward

        /*
        There can exist multiple resource requests for same resource, example (in chronological order):
            Wellness preparation: 15min     (Preparation, Overlap allowed)
            Wellness session: 2h
            Wellness cleanup: 30min         (Preparation, Overlap allowed)

        */

        let sortOrder: 'asc' | 'desc' = 'asc'

        if (!searchForward)
            sortOrder = 'desc'


        let requestItemsSameResource = resourceRequest.getItemsForResource(resource.id, sortOrder)

        let firstRequestItem: ResourceRequestItem = requestItemsSameResource[0]


        let offsetRefDate: Date = searchForward ? availableRange.from : availableRange.to
        let isFirstLoop = true


        /** get the active schedule -> in order to know block size  */

        var startLabelHandled = false


        // we try to find slots until we reach end of availableRange
        while ((searchForward && offsetRefDate < availableRange.to)
            || (!searchForward && offsetRefDate >= availableRange.from)) {




            currentSolution = new Solution(resourceRequest)
            currentSolution.offsetRefDate = offsetRefDate

            solutions.push(currentSolution)

            let firstRequestProcessed = false

            if (isFirstLoop && firstRequestItem.isPrepTime && firstRequestItem.prepOverlap) {

                let solutionItem = this.handlePreparationRequestItem(currentSolution, searchForward, resource, firstRequestItem, availableRange, availability, ctx)

                // set the reference date for this solution
                offsetRefDate = dateFns.addSeconds(solutionItem.dateRange.from, -firstRequestItem.offsetInSeconds(currentSolution.overrides))
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

            /**
             * retrieve block definition (series) in order to know the default space between reservations  
             */
            const series = ctx.getBlockSeries(resReqItem.product, offsetRefDate)

            if (!series)
                throw `Block definition NOT found`

            let durationEmptyBlock = series.durationEmptyBlock()

            if (searchForward)
                offsetRefDate = dateFns.addMinutes(offsetRefDate, durationEmptyBlock)
            else {
                offsetRefDate = dateFns.addMinutes(offsetRefDate, -durationEmptyBlock)

                /**
                 * We're searching backwards (example from 12h back to 9h)
                 * At a certain moment offsetRefDate will be before 9h, example 8h
                 * => we will also try 9h 
                 */

                if (!startLabelHandled && offsetRefDate < availableRange.from && availableRange.containsFromLabel('START')) {
                    offsetRefDate = availableRange.from
                    startLabelHandled = true
                }

            }
        }

        console.error(requestItemsSameResource)

        // we mark all request items as processed
        requestItemsSameResource.forEach(requestItem => requestItem.isProcessed = true)

        return solutions

    }




    handlePreparationRequestItem(solution: Solution, searchForward: boolean, resource: Resource, firstRequestItem: ResourceRequestItem, availableRange: DateRange, availability: ResourceAvailability2, ctx: AvailabilityContext): SolutionItem {
        // this is a preparation block that can overlap with existing (preparations) => try to find one

        let existingPrepBlock: DateRange

        if (searchForward)
            existingPrepBlock = availability.getPreparationBlockJustBefore(resource.id, availableRange.from)
        else
            existingPrepBlock = availability.getPreparationBlockJustAfter(resource.id, availableRange.to)

        let prepFrom: Date, prepTo: Date


        console.log(existingPrepBlock)

        if (existingPrepBlock) {

            let existingPrepBlockLonger = existingPrepBlock.seconds() >= firstRequestItem.durationInSeconds(solution)

            if (searchForward) {

                if (existingPrepBlockLonger) {
                    // the requested time block fits into the existing one
                    prepTo = existingPrepBlock.to   // same as availableRange.from
                    prepFrom = dateFns.addSeconds(prepTo, -firstRequestItem.durationInSeconds(solution))
                } else {
                    prepFrom = existingPrepBlock.from
                    prepTo = dateFns.addSeconds(prepFrom, firstRequestItem.durationInSeconds(solution))
                }

            } else {  // search backward

                if (existingPrepBlockLonger) {

                    // the requested time block fits into the existing one
                    prepFrom = existingPrepBlock.from
                    prepTo = dateFns.addSeconds(prepFrom, firstRequestItem.durationInSeconds(solution))


                    /* prepTo = existingPrepBlock.to   // same as availableRange.from
                    prepFrom = dateFns.addSeconds(prepTo, -firstRequestItem.seconds()) */
                } else {

                    prepTo = existingPrepBlock.to
                    prepFrom = dateFns.addSeconds(prepTo, -firstRequestItem.durationInSeconds(solution))


                    /* prepFrom = existingPrepBlock.from
                    prepTo = dateFns.addSeconds(prepFrom, firstRequestItem.seconds()) */
                }


            }

        } else {

            // there is no existing preparation block where we can overlap with => create inside the available range

            const prepTime = firstRequestItem.durationInSeconds(solution)

            if (searchForward) {
                prepFrom = availableRange.from

                if (availableRange.containsFromLabel('START')) {
                    // get the current schedule in order to see if preparations can be done outside schedule
                    let schedule = ctx.getScheduleOnDate(resource.id, prepFrom)

                    if (!schedule)
                        throw new Error(`No schedule found`)

                    // check if preparations can be done outside schedule
                    if (!schedule.prepIncl)
                        prepFrom = dateFns.addSeconds(availableRange.from, -firstRequestItem.durationInSeconds(solution))
                }

            } else {
                prepFrom = dateFns.addSeconds(availableRange.to, -prepTime)
            }

            prepTo = dateFns.addSeconds(prepFrom, firstRequestItem.durationInSeconds(solution))
        }

        let newPreparationRange = new DateRange(prepFrom, prepTo)

        let durationFixed = false
        let solutionItem = new SolutionItem(solution, firstRequestItem, newPreparationRange, true, durationFixed, resource)

        return solutionItem
    }

    handleBasicRequestItems(searchForward: boolean, resource: Resource, requestItemsSameResource: ResourceRequestItem[], startDate: Date, availableRange: DateRange, solution: Solution
        , availability: ResourceAvailability2, ctx: AvailabilityContext) {

        for (let i = 0; i < requestItemsSameResource.length; i++) {

            let requestItem = requestItemsSameResource[i]
            let solutionItem = this.handleBasicRequestItem(searchForward, resource, requestItem, startDate, availableRange, solution, availability, ctx)

            solution.add(solutionItem)

            if (!solutionItem.valid) {


                solution.valid = false
                break  // we don't continue with current solution
            }
        }

    }


    handleBasicRequestItem(searchForward: boolean, resource: Resource, requestItem: ResourceRequestItem, startDate: Date, availableRange: DateRange, solution: Solution
        , availability: ResourceAvailability2, ctx: AvailabilityContext): SolutionItem {

        let requestFrom = dateFns.addSeconds(startDate, requestItem.offsetInSeconds(solution.overrides))
        let requestTo = dateFns.addSeconds(requestFrom, requestItem.durationInSeconds(solution))

        let requestRange = new DateRange(requestFrom, requestTo)

        // if requestRange is still within available range: then all is still ok
        let outsideOfRange = !requestRange.isInsideOf(availableRange)

        let durationFixed = false
        let solutionItem = new SolutionItem(solution, requestItem, requestRange, true, durationFixed, resource)


        if (outsideOfRange) {
            solutionItem.valid = false

            // then maybe check if preparation outside or overlapping with other preparation time if allowed 
            if (requestItem.isPrepTime) {

                // check if outside 
                solutionItem = this.handlePreparationRequestItem2(searchForward, resource, requestItem, requestRange, availableRange, availability, ctx, solution)


            }


            if (!solutionItem.valid)
                solutionItem.addNote(`${requestRange.toString()} not in available range ${availableRange.toString()}`)
        }

        return solutionItem
    }

    handlePreparationRequestItem2(searchForward: boolean, resource: Resource, requestItem: ResourceRequestItem, requestRange: DateRange, availableRange: DateRange, availability: ResourceAvailability2, ctx: AvailabilityContext, solution: Solution) {

        let durationFixed = false
        let solutionItem = new SolutionItem(solution, requestItem, requestRange, true, durationFixed, resource)
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
                    return solutionItem
                } else {

                    // preparation partially outside schedule

                    let rangesInsideSchedule = schedule.insideSchedule(requestRange)

                    if (availableRange.containsSet(rangesInsideSchedule)) {
                        solutionItem.valid = true
                        solutionItem.addNote(`${requestRange.toString()} is preparation time AND is partially outside schedule, but this is allowed!`, SolutionNoteLevel.info)
                        return solutionItem
                    }

                }

                // check if we are outside schedule
                console.warn('NOW WE NEED TO LOOK OUTSIDE SCHEDULE')


            }
        }


        if (searchForward) {

            /* handle case that preparation at the end can overlap preparation at the beginning
            */

            let existingPrepBlock = availability.getPreparationBlockJustAfter(resource.id, requestRange.from)

            if (existingPrepBlock?.isEqualOrLongerThen(requestRange)) {
                solutionItem.valid = true
                return solutionItem
            }


        } else { // search backward (but currently not used?)

            let existingPrepBlock = availability.getPreparationBlockJustBefore(resource.id, requestRange.to)

            if (existingPrepBlock?.isEqualOrLongerThen(requestRange)) {
                solutionItem.valid = true
                return solutionItem
            }


        }



        return solutionItem

    }


    /*
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
    
    
    
            return dateRanges
    
    
        }*/


    getFullDayStartDates(product: Product, dateRange: DateRange, ctx: AvailabilityContext, schedules: BranchSchedules): DateRangeSet {



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