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


    debug = false





    /**
     *  There can be multiple resourceRequests: for instance different requests per branch schedule 
     */
    findSlots(availability2: ResourceAvailability2, ctx: AvailabilityContext, ...resourceRequests: ResourceRequest[]): SolutionSet {


        // this.debug()


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


        let i = 0

        /** a set typically contains the availability for 1 resource */
        for (const set of firstItemAvailabilities.sets) {
            for (const range of set.ranges) {

                const availableRange = range.clone()
                availableRange.qty = firstRequestItem.qty

                let possibleDateRanges = DateRangeSet.empty

                // we reduce by the duration because we want interval with possible start dates
                availableRange.increaseToWithSeconds(-firstRequestItem.duration.seconds)

                if (availableRange.to < availableRange.from)
                    continue

                possibleDateRanges.addRanges(availableRange)

                // possibleDateRanges only contains 1 range
                const solutions = possibleDateRanges.toSolutions(resourceRequest, firstRequestItem, false, set.resource)

                for (let solution of solutions) {
                    for (let solItem of solution.items)
                        solItem.addNote(`Initial range ${solItem.dateRange.toString()}`)
                }

                solutionSet.add(...solutions)

                if (this.debug && i == 0)
                    break

                i++
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

                let possibleResources = requestItem.resources

                const hasAffinity = requestItem.hasAffinity()

                /** check if this request item is related to previous items */
                if (hasAffinity) {
                    let affinitySolutionItem = solution.getSolutionItemForRequestItem(requestItem.affinity.id)
                    possibleResources = affinitySolutionItem.resources
                }

                let resourceNames = possibleResources.map(r => r.name).join(',')

                if (hasAffinity)
                    solution.addNote(`Affinity for: ${resourceNames}`)



                const availableResources = availability.getAvailabilityOfResourcesInRange(possibleResources, checkInRange, requestItem.duration, solution, !hasAffinity, requestItem.personId)

                /*
                    below we check resourceQuantityEquals=1 -> quick fix, because if resource.qty > 1 algo not correct yet!!
                    this.resourceQuantityEquals(possibleResources, 1) && 
                */

                // if we have no availabilities for the new requestItem, then we are on a dead-end for this solution
                if (availableResources.isEmpty()) {


                    solution.addNote(`No availability found for '${resourceNames}' in range ${checkInRange.toString()} for ${requestItem.duration.toString()}`)


                    const forDebuggingAgain = availability.getAvailabilityOfResourcesInRange(possibleResources, checkInRange, requestItem.duration, solution, !hasAffinity, requestItem.personId)

                    solution.valid = false

                    if (trackInvalidSolutions)
                        resultSolutions.add(solution)
                    continue
                }


                /* Create a new solution for each possible availability
                */
                let i = 0

                for (const availabilitiesForResource of availableResources.sets) {

                    const resources = []
                    if (availabilitiesForResource.resource)
                        resources.push(availabilitiesForResource.resource)

                    for (const availabilityForResource of availabilitiesForResource.ranges) {

                        const newSolution = solution.clone()

                        let availableRange = availabilityForResource.clone()


                        if (this.debug && dateFns.format(availableRange.from, 'HH:mm') == '17:10')
                            console.log(availableRange.from)

                        availableRange.to = dateFns.subSeconds(availableRange.to, requestItem.duration.seconds)

                        const solutionItem = new SolutionItem(requestItem, availableRange, false, ...resources)
                        newSolution.add(solutionItem)
                        solutionItem.addNote(`Limiting available range: ${availableRange.toString()}`)

                        resultSolutions.add(newSolution)

                        if (this.debug && i == 0)
                            break

                        i++
                    }

                    if (this.debug && i == 0)
                        break
                }

                console.warn(availableResources)
                //availability.getAvailability()
            }
        }

        requestItem.isProcessed = true

        return resultSolutions

    }

    resourceQuantityEquals(resources: Resource[], num = 1): boolean {

        if (ArrayHelper.IsEmpty(resources))
            return false

        for (let resource of resources) {
            if (resource.qty != num)
                return false
        }

        return true
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


    checkStaffBreaks(solutionSet: SolutionSet, ctx: AvailabilityContext, breakTimeInMinutes: number = 40) {

        /** can contain breaks for multiple days! */
        const breaksByResourceId = ctx.getStaffBreakRanges()
        const staffBreak = TimeSpan.minutes(breakTimeInMinutes)

        // we will invalidate some solutions and replace with new solutions to allow breaks for staff
        // const newSolutions: Solution[] = []

        let solutionsToCheck: Solution[] = solutionSet.validSolutions

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

                if (solution.breaksChecked.indexOf(human.id) >= 0)
                    continue

                // the outer official break windows wherin we need to forsee a break
                let breaksForStaffMember = breaksByResourceId.get(human.id)


                if (!breaksForStaffMember || breaksForStaffMember.isEmpty())
                    continue

                let nrOfBreaks = breaksForStaffMember.count

                // we need to subtract what is already booked
                const alreadyOccupied = ctx.getResourceOccupation2(human.id)
                breaksForStaffMember = breaksForStaffMember.subtract(alreadyOccupied.unAvailable)


                const staffSolItems = humanResourcesItems.getItemsForResource(human.id)

                const staffDateRanges = staffSolItems.toDateRangeSet()


                let dayBreaksForStaffMember = breaksForStaffMember.getRangesForSameDay(solution.offsetRefDate)

                // remove parts of break (caused by other bookings in middle of break) that are too small 
                dayBreaksForStaffMember = dayBreaksForStaffMember.minimum(TimeSpan.minutes(breakTimeInMinutes))

                if (!dayBreaksForStaffMember || dayBreaksForStaffMember.isEmpty())
                    continue

                if (solution.hasExactStart()) {

                    const newBreaks = dayBreaksForStaffMember.subtract(staffDateRanges)

                    const possibleBreaks = newBreaks.atLeast(staffBreak)

                    if (possibleBreaks.isEmpty()) {
                        // this solution is causing too small breaks!!
                        solution.valid = false
                        solution.breaksChecked.push(human.id)

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
                    if (remainingOfBreaks.count >= nrOfBreaks
                        && remainingOfBreaks.allAtLeast(staffBreak))
                        continue

                    /* check if overlap with break windows too small => always still possible to have a pause
                      
                    if (break window - staff Occupation) / 2 >= staff break 
                       then there is never a problem
                    */
                    const staffOccupation: TimeSpan = staffSolItems.totalRequestDuration()


                    let newBreakWindows = dayBreaksForStaffMember.subtractAll(staffOccupation)


                    let fullOverlap = newBreakWindows.isEmpty()

                    /*
                    if (newBreakWindows.isEmpty()) {
                        solution.valid = false
                        solution.addNote(`${human.name} can't have a break within ${dayBreaksForStaffMember.toString()}`)
                        break   // quit checking staff rbeaks for this solution, goto next solution
                    }*/

                    let tooSmallBreakWindows: DateRangeSet


                    if (fullOverlap) {
                        tooSmallBreakWindows = dayBreaksForStaffMember

                    } else {  // there is a partial overlap

                        let compareWith = staffBreak.times(2)
                        tooSmallBreakWindows = newBreakWindows.lessThen(compareWith)
    
                        if (tooSmallBreakWindows.isEmpty()) {
                            // no too small breaks => no risk with this solution
                            continue
                        }

                    }





                    // here we assume that at least 1 pause is in the middle of this solution, so we need to split

                    for (let tooSmallBreakWindow of tooSmallBreakWindows.ranges) {

                        // retrieve original break window
                        let breakWindow = dayBreaksForStaffMember.getRangeStartingAt(tooSmallBreakWindow.from)

                        /** get time from beginning of solution until this staff member is not needed anymore */
                        const staffOccupationFromStart: TimeSpan = staffSolItems.totalRequestDurationInclOffset()



                        const startOfLastBreak = dateFns.subMinutes(breakWindow.to, breakTimeInMinutes)

                        solution.valid = false
                        solution.addNote(`${human.name} can't have a break within ${breakWindow.toString()}: we will create new solutions (if possible) before & after possible break`)


                        // Create first solution (before break)

                        const lastPossibleStartOfSolution = dateFns.subSeconds(startOfLastBreak, staffOccupationFromStart.seconds)

                        if (lastPossibleStartOfSolution >= solution.offsetRefDate) {

                            const solutionBeforeBreak = solution.clone()
                            solutionBeforeBreak.valid = true

                            // we need te re-evalutae this new solution for other (potential) break problems
                            solutionSet.add(solutionBeforeBreak)
                            // solutionsToCheck.splice(0, solutionsToCheck.length)
                            solutionsToCheck.push(solutionBeforeBreak)



                            solutionBeforeBreak.limitOtherItems(solution.offsetRefDate, lastPossibleStartOfSolution)

                            const lastBreak = new DateRange(startOfLastBreak, breakWindow.to)
                            solutionBeforeBreak.addNote(`Solution created to enable break for ${human.name}. Last possible break: ${lastBreak.toString()}`)
                            solutionBeforeBreak.breaksChecked.push(human.id)

                            newSolutionsCreated = true
                        }



                        // Create second solution (after break)

                        const endOfFirstBreak = dateFns.addMinutes(breakWindow.from, breakTimeInMinutes)

                        //const lastPossibleStartOfSolution = dateFns.subSeconds(startOfLastBreak, staffOccupationFromStart.seconds)


                        const lastPossibleEndOfSolution = solution.items[0].dateRange.to

                        if (endOfFirstBreak < lastPossibleEndOfSolution) {
                            const solutionAfterBreak = solution.clone()
                            solutionAfterBreak.valid = true

                            // we need te re-evalutae this new solution for other (potential) problems
                            solutionSet.add(solutionAfterBreak)
                            solutionsToCheck.push(solutionAfterBreak)

                            solutionAfterBreak.limitOtherItems(endOfFirstBreak)

                            const firstBreak = new DateRange(breakWindow.from, endOfFirstBreak)
                            solutionAfterBreak.addNote(`Solution created to enable break for ${human.name}. First possible break: ${firstBreak.toString()}`)
                            solutionAfterBreak.breaksChecked.push(human.id)

                            newSolutionsCreated = true
                        }



                        break

                    }






                    if (newSolutionsCreated)   // then we re-evaluate these new solutions from the beginning
                        break


                }

                solution.breaksChecked.push(human.id)

                if (!solution.valid)
                    break
            }


            solutionCount++

            if (solutionCount > 200) {
                break

            }


        }





    }

    addHM(date: Date, hours: number, mins: number = 0): Date {

        let newDate = date

        newDate = dateFns.addHours(newDate, hours)

        newDate = dateFns.addMinutes(newDate, mins)

        return newDate
    }

    debugRanges() {

        let date = new Date(2024, 10, 19)

        let set1 = new DateRangeSet()
        set1.addRangeByDates(this.addHM(date, 12, 15), this.addHM(date, 13, 25))

        let set2 = new DateRangeSet()
        set2.addRangeByDates(this.addHM(date, 9, 30), this.addHM(date, 11, 45))
        set2.addRangeByDates(this.addHM(date, 12), this.addHM(date, 12, 15))
        set2.addRangeByDates(this.addHM(date, 13, 25), this.addHM(date, 14))
        set2.addRangeByDates(this.addHM(date, 14), this.addHM(date, 14, 30))
        set2.addRangeByDates(this.addHM(date, 14, 30), this.addHM(date, 15, 45))
        set2.addRangeByDates(this.addHM(date, 16, 30), this.addHM(date, 17, 25))

        let set3 = set1.union(set2)

        console.log(set3)

    }



}