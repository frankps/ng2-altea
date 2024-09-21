/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AvailabilityContext, DateRange, DateRangeSet, PlanningBlockSeries, PlanningMode, PossibleSlots, Product, Resource, ResourceAvailability, ResourceAvailability2, ResourcePlanning, ResourceRequest, ResourceRequestItem, ResourceType, SlotInfo, Solution, SolutionItem, SolutionNoteLevel, TimeSpan } from "ts-altea-model";
import * as _ from "lodash"
import { ResourceRequestOptimizer } from "./resource-request-optimizer";
import { scheduled } from "rxjs";
import * as dateFns from 'date-fns'
import { SlotFinderBlocks } from "./slot-finder-blocks";
import { SolutionSet } from "ts-altea-model";
import { SlotFinderContinuous } from "./slot-finder-continuous";
import { ArrayHelper } from "ts-common";

// (resourceRequest: ResourceRequest, availability: ResourceAvailability):
export class SlotFinder {


    static _I: SlotFinder = new SlotFinder()

    /** Returns instance of this class */
    static get I(): SlotFinder {
        return SlotFinder._I
    }

    checkStaffBreaks(solutionSet: SolutionSet, ctx: AvailabilityContext, breakTimeInMinutes: number = 40) {

        /** can contain breaks for multiple days! */
        const breaksByResourceId = ctx.getStaffBreakRanges()
        const staffBreak = TimeSpan.minutes(breakTimeInMinutes)

        // we will invalidate some solutions and replace with new solutions to allow breaks for staff
        // const newSolutions: Solution[] = []

        let solutionsToCheck : Solution[] = solutionSet.validSolutions

        //solutionsToCheck = solutionsToCheck.splice(1, solutionsToCheck.length - 1)

        let solution: Solution

        let solutionCount = 0


        while (solution = solutionsToCheck.pop()) {

            let newSolutionsCreated = false

            const humanResourcesItems = solution.getHumanResourceItems()

            if (humanResourcesItems.isEmpty())
                continue

            const humanResources = humanResourcesItems.humanResources()

            for (var human of humanResources) {

                const breaksForStaffMember = breaksByResourceId.get(human.id)

                if (!breaksForStaffMember || breaksForStaffMember.isEmpty())
                    continue

                const staffSolItems = humanResourcesItems.getItemsForResource(human.id)

                const staffDateRanges = staffSolItems.toDateRangeSet()

                const dayBreaksForStaffMember = breaksForStaffMember.getRangesForSameDay(solution.offsetRefDate)

                if (!dayBreaksForStaffMember || dayBreaksForStaffMember.isEmpty())
                    continue

                if (solution.hasExactStart()) {

                    const newBreaks = dayBreaksForStaffMember.subtract(staffDateRanges)

                    const possibleBreaks = newBreaks.atLeast(staffBreak)

                    if (possibleBreaks.isEmpty()) {
                        // this solution is causing too small breaks!!
                        solution.valid = false

                        solution.addNote(`Problem with too small breaks for ${human.name} ${newBreaks.toString()}`, SolutionNoteLevel.blocking)
                        break
                    }
                } else {
                    /* solution has not exact start, but has window of possible starts */

                    // check if solution items (for staff member) has overlap with break

                    const staffDateRange = staffSolItems.getOuterRange2()

                    // if no potential overlap with breaks, then no problem
                    
                    if (!dayBreaksForStaffMember.hasOverlapWith(staffDateRange))
                        continue


                    // if remaining of break window is still big enough, then no problem
                
                    const remainingOfBreaks = dayBreaksForStaffMember.subtractRange(staffDateRange)  

                    if (remainingOfBreaks.count == dayBreaksForStaffMember.count 
                        && remainingOfBreaks.allAtLeast(staffBreak))
                        continue

                    /* check if overlap with break windows too small => always still possible to have a pause
                      
                    if (break window - staff Occupation) / 2 >= staff break 
                       then there is never a problem
                    */
                    const staffOccupation: TimeSpan = staffSolItems.totalRequestDuration()
                    let newBreakWindows = dayBreaksForStaffMember.substractAll(staffOccupation)
                    let compareWith = staffBreak.times(2)
                    const tooSmallBreakWindows = newBreakWindows.lessThen(compareWith)

                    if (tooSmallBreakWindows.isEmpty()) {
                        // no too small breaks => no risk with this solution
                        continue
                    }


                    // here we assume that at least 1 pause is in the middle of this solution, so we need to split

                    for (let tooSmallBreakWindow of tooSmallBreakWindows.ranges) {

                        // retrieve original break window
                        let breakWindow = dayBreaksForStaffMember.getRangeStartingAt(tooSmallBreakWindow.from)

                        /** get time from beginning of solution until this staff member is not needed anymore */
                        const staffOccupationFromStart: TimeSpan = staffSolItems.totalRequestDurationInclOffset()


                        const endOfFirstBreak = dateFns.addMinutes(breakWindow.from, breakTimeInMinutes)
                        const startOfLastBreak = dateFns.subMinutes(breakWindow.to, breakTimeInMinutes)

                        solution.valid = false


                        // Create first solution (before break)

                        const lastPossibleStartOfSolution = dateFns.subSeconds(startOfLastBreak, staffOccupationFromStart.seconds)

                        const solutionBeforeBreak = solution.clone()

                        // we need te re-evalutae this new solution for other (potential) break problems
                        solutionSet.add(solutionBeforeBreak)
                       // solutionsToCheck.splice(0, solutionsToCheck.length)
                        solutionsToCheck.push(solutionBeforeBreak)



                        solutionBeforeBreak.limitOtherItems(solution.offsetRefDate, lastPossibleStartOfSolution)

                        const lastBreak = new DateRange(startOfLastBreak, breakWindow.to)
                        solutionBeforeBreak.addNote(`Solution created to enable break for ${human.name}. Last possible break: ${lastBreak.toString()}`)


                        // Create second solution (after break)

                        //const lastPossibleStartOfSolution = dateFns.subSeconds(startOfLastBreak, staffOccupationFromStart.seconds)

                        const solutionAfterBreak = solution.clone()

                        // we need te re-evalutae this new solution for other (potential) problems
                        solutionSet.add(solutionAfterBreak)
                        solutionsToCheck.push(solutionAfterBreak)


                        solutionAfterBreak.limitOtherItems(endOfFirstBreak)

                        const firstBreak = new DateRange(breakWindow.from, endOfFirstBreak)
                        solutionAfterBreak.addNote(`Solution created to enable break for ${human.name}. First possible break: ${firstBreak.toString()}`)

                        newSolutionsCreated = true

                        break

                    }


                    if (newSolutionsCreated)   // then we re-evaluate these new solutions from the beginning
                        break


                }

                if (!solution.valid)
                    break
            }


            solutionCount++

            if (solutionCount > 200) {
                break

            }
                

        }





    }


    /**
     *  There can be multiple resourceRequests: for instance different requests per branch schedule 
     */
    findSlots(availability2: ResourceAvailability2, ctx: AvailabilityContext, ...resourceRequests: ResourceRequest[]): SolutionSet {



        const branchModeRanges = ctx.getBranchModeRanges(ctx.request.getDateRange())
        console.warn(branchModeRanges)

        const allSolutions = new SolutionSet()

        for (let branchModeRange of branchModeRanges) {

            let brancheScheduleId = branchModeRange.schedule.id

            let resourceRequest = resourceRequests.find(req => req?.schedule?.id && req.schedule.id == brancheScheduleId)

            if (!resourceRequest) {
                console.error('No specific resourceRequest found for branch schedule!')
                resourceRequest = resourceRequests[0]
            }

            const result = this.findSlotsInternal(availability2, ctx, resourceRequest)
            allSolutions.add(...result.solutions)
        }

        const exactSolutions = allSolutions //.toExactSolutions()

        return exactSolutions
    }


    private orderSolutionSet(solutionSet: SolutionSet) {

        if (!solutionSet || ArrayHelper.IsEmpty(solutionSet.solutions))
            return


        for (let solution of solutionSet.solutions) {
            // solution.items

            solution.items = _.sortBy(solution.items, item => item.dateRange.from)
        }

    }

    // availability: ResourceAvailability,
    private findSlotsInternal(availability2: ResourceAvailability2, ctx: AvailabilityContext, resourceRequest: ResourceRequest): SolutionSet {


        console.error('Start findSlots()')

        if (!resourceRequest)
            throw new Error(`resourceRequest not specified!`)

        /**
         *  First create intial solutions = availability for the first resource request item
         * 
         *  To do: also do non-block resources ...
         */
        let solutionSet = this.createInitialSolutions(availability2, ctx, resourceRequest)

        if (resourceRequest.items.length == 1)
            return solutionSet

        /**
         *  Given the initial solution, we need to check availabilities for other resource request items
         */

        while (resourceRequest.hasItemsToProcess()) {
            const requestItem = resourceRequest.nextItemToProcess()

            solutionSet = this.handleResourceRequestItem(requestItem, solutionSet, availability2)
        }

        this.checkStaffBreaks(solutionSet, ctx)

        this.orderSolutionSet(solutionSet)

        return solutionSet
    }



    createInitialSolutions(availability2: ResourceAvailability2, ctx: AvailabilityContext, resourceRequest: ResourceRequest): SolutionSet {

        const solutionSet = new SolutionSet()


        const firstRequestItem = resourceRequest.items[0]

        const product = firstRequestItem.product

        // PlanningMode = BLOCK
        // ====================

        if (product.planMode == PlanningMode.block) {

            const solutionSet = SlotFinderBlocks.I.createInitialSolutions(availability2, ctx, resourceRequest)
            return solutionSet
        }

        // PlanningMode = CONTINOUS
        // ========================

        const firstItemAvailabilities = availability2.getAvailabilities(firstRequestItem.resources)

        /** a set typically contains the availability for 1 resource */
        for (const set of firstItemAvailabilities.sets) {
            for (const range of set.ranges) {

                const availableRange = range.clone()

                let possibleDateRanges = DateRangeSet.empty

                // we reduce by the duration because we want interval with possible start dates
                availableRange.increaseToWithSeconds(-firstRequestItem.duration.seconds)
                possibleDateRanges.addRange(availableRange)


                const solutions = possibleDateRanges.toSolutions(resourceRequest, firstRequestItem, false, set.resource)
                solutionSet.add(...solutions)


            }
        }

        firstRequestItem.isProcessed = true

        return solutionSet

    }




    /**
     * evaluates each solution from existing solutionSet, and tries to fulfill the next requestItem. If fulfilled, a new corresponding solution item is added to the soltion. 
     * If not fulfilled, solution becomes invalid.
     * 
     * @param requestItem 
     * @param solutionSet 
     */
    handleResourceRequestItem(requestItem: ResourceRequestItem, solutionSet: SolutionSet, availability: ResourceAvailability2, trackInvalidSolutions = true): SolutionSet {


        /**
         * One solution can end up in:
         *  - no solution
         *  - more then 1 solutions
         */
        const resultSolutions = new SolutionSet()

        let resourceGroupName = requestItem.resourceGroup?.name

        /**
         * We continue to build further upon existing solutions (solutionSet)
         */

        for (const solution of solutionSet.solutions) {

            if (!solution.valid) {
                resultSolutions.add(solution)
                continue
            }

            //const refDate = solution.referenceDate()

            const referenceSolutionItem = solution.items[0]


            if (referenceSolutionItem.exactStart) {
                /* exactStart = true !!! => the first item in the solution has exact start and end */

                if (!solution.offsetRefDate)
                    throw new Error(`solution.offsetRefDate not set!`)

                const from = dateFns.addSeconds(solution.offsetRefDate, requestItem.offset.seconds)
                const to = dateFns.addSeconds(from, requestItem.duration.seconds)
                const range = new DateRange(from, to)


                // the notes are for extra debug info
                const resourcesWithNotes = availability.getAvailableResourcesInRange(requestItem.resources, range, requestItem, solution, true)
                const availableResources = resourcesWithNotes.result
                solution.addNotes(resourcesWithNotes.notes)


                if (availableResources.length >= requestItem.qty) {
                    const solutionItem = new SolutionItem(requestItem, range.clone(), true, ...availableResources)
                    solution.add(solutionItem)

                    resultSolutions.add(solution.clone())

                } else {

                    solution.valid = false

                    const interval = `[${dateFns.format(from, 'dd/MM HH:mm')}, ${dateFns.format(to, 'dd/MM HH:mm')}]`

                    let onlyAvailable = '/'
                    if (availableResources.length > 0) {
                        onlyAvailable = availableResources.map(r => r.shortOrName()).join(', ')
                    }

                    if (requestItem.resourceGroup) {


                        solution.addNote(`Not enough recources for '${resourceGroupName}': ${availableResources.length}/${requestItem.qty}, ${interval}, available: ${onlyAvailable}`)

                    } else if (requestItem.hasResources()) {

                        solution.addNote(`No availability found for '${requestItem.resourceNames()}': ${availableResources.length}/${requestItem.qty}, ${interval}, available: ${onlyAvailable}`)

                    }




                    if (trackInvalidSolutions)
                        resultSolutions.add(solution.clone())

                }



            } else {
                /* exactStart=false => the reference solution item (first item in solution) is not an exact start, but rather an interval where-in the first request item can start
                It can START in the range [referenceSolutionItem.dateRange.from, referenceSolutionItem.dateRange.to]
                => we need to check the availability of the new requestItem relativly to the above range (see what is possible)
                */


                // IMPORTANT: maybe convert refFrom to solution.offsetRefDate (same as done in if then statement above)

                const refFrom = referenceSolutionItem.dateRange.from
                const refTo = referenceSolutionItem.dateRange.to

                if (!refFrom)
                    throw new Error(`No reference (start) date available`)


                const startFrom = dateFns.addSeconds(refFrom, requestItem.offset.seconds)
                const startTo = dateFns.addSeconds(refTo, requestItem.offset.seconds)
                const endsOn = dateFns.addSeconds(startTo, requestItem.duration.seconds)

                // const startRange = new DateRange(startFrom, startTo)
                const checkInRange = new DateRange(startFrom, endsOn)

                const availableResources = availability.getAvailabilityOfResourcesInRange(requestItem.resources, checkInRange, requestItem.duration, solution)

                // if we have no availabilities for the new requestItem, then we are on a dead-end for this solution
                if (availableResources.isEmpty()) {
                    solution.valid = false

                    if (trackInvalidSolutions)
                        resultSolutions.add(solution)
                    continue
                }


                /* Create a new solution for each possible availability
                */
                for (const availabilitiesForResource of availableResources.sets) {

                    const resources = []
                    if (availabilitiesForResource.resource)
                        resources.push(availabilitiesForResource.resource)

                    for (const availabilityForResource of availabilitiesForResource.ranges) {

                        const newSolution = solution.clone()

                        let availableRange = availabilityForResource.clone()


                        availableRange.to = dateFns.subSeconds(availableRange.to, requestItem.duration.seconds)

                        const solutionItem = new SolutionItem(requestItem, availableRange, false, ...resources)
                        newSolution.add(solutionItem)

                        resultSolutions.add(newSolution)

                    }
                }

                console.warn(availableResources)
                //availability.getAvailability()
            }
        }

        requestItem.isProcessed = true

        return resultSolutions

    }


    findContinuousSlots(dateRange: DateRange, slots: SlotInfo[]) {

        const startDates = dateRange.getDatesEvery(TimeSpan.minutes(15))

        slots.push(...startDates.map(date => SlotInfo.fromDate(date)))

    }





    isFullDay(dateRange: DateRange, ctx: AvailabilityContext): boolean {

        return true
    }







    /** remove doubles or slots that are too close */
    cleanSlots(slots: SlotInfo[]): SlotInfo[] {

        slots = _.sortBy(slots, 'start')
        slots = _.uniqBy(slots, 'start')

        return slots

    }


}