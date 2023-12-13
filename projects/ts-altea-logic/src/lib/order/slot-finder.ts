/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AvailabilityContext, DateRange, DateRangeSet, PlanningBlockSeries, PlanningMode, PossibleSlots, Product, Resource, ResourceAvailability, ResourcePlanning, ResourceRequest, ResourceRequestItem, ResourceType, SlotInfo, Solution, SolutionItem, TimeSpan } from "ts-altea-model";
import * as _ from "lodash"
import { ResourceRequestOptimizer } from "./resource-request-optimizer";
import { scheduled } from "rxjs";
import * as dateFns from 'date-fns'
import { SlotFinderBlocks } from "./slot-finder-blocks";
import { SolutionSet } from "ts-altea-model";
import { SlotFinderContinuous } from "./slot-finder-continuous";

// (resourceRequest: ResourceRequest, availability: ResourceAvailability):
export class SlotFinder {


    static _I: SlotFinder = new SlotFinder()

    /** Returns instance of this class */
    static get I(): SlotFinder {
        return SlotFinder._I
    }

    /**
     *  There can be multiple resourceRequests: for instance different requests per branch schedule 
     */
    findSlots(availability: ResourceAvailability, ctx: AvailabilityContext, ...resourceRequests: ResourceRequest[]): SolutionSet {

        const resourceRequest = resourceRequests[0]

        const solutions = this.findSlotsInternal(availability, ctx, resourceRequest)


        const exactSolutions = solutions //.toExactSolutions()

        return exactSolutions
    }



    private findSlotsInternal(availability: ResourceAvailability, ctx: AvailabilityContext, resourceRequest: ResourceRequest): SolutionSet {


        console.error('Start findSlots()')

        if (!resourceRequest)
            throw new Error(`resourceRequest not specified!`)

        /**
         *  First create intial solutions = availability for the first resource request item
         * 
         *  To do: also do non-block resources ...
         */
        let solutionSet = this.createInitialSolutions(availability, ctx, resourceRequest)

        if (resourceRequest.items.length == 1)
            return solutionSet

        /**
         *  Given the initial solution, we need to check availabilities for other resource request items
         */

        for (let i = 1; i < resourceRequest.items.length; i++) {
            const requestItem = resourceRequest.items[i]

            solutionSet = this.handleResourceRequestItem(requestItem, solutionSet, availability)

        }




        return solutionSet
    }



    createInitialSolutions(availability: ResourceAvailability, ctx: AvailabilityContext, resourceRequest: ResourceRequest): SolutionSet {

        const solutionSet = new SolutionSet()


        const firstRequestItem = resourceRequest.items[0]
        const firstItemAvailabilities = availability.getAvailabilities(firstRequestItem.resources)

        const product = firstRequestItem.product

        /** a set typically contains the availability for 1 resource */
        for (const set of firstItemAvailabilities.sets) {
            for (const range of set.ranges) {

                const availableRange = range.clone()

                let possibleDateRanges = DateRangeSet.empty

                /** some services work with fixed blocks (like Wellness reservation), others or more floating blocks (service is possible within interval) */
                let exactStart = false

                if (product.planMode == PlanningMode.block) {

                    possibleDateRanges = SlotFinderBlocks.I.findSlots(firstRequestItem, availableRange, ctx)
                    exactStart = true

                } else {
                    //possibleDateRanges = SlotFinderContinuous.I.findSlots(firstRequestItem, dateRange, ctx)


                    availableRange.changeTo(-firstRequestItem.duration.seconds)
                    possibleDateRanges.addRange(availableRange)


                }




                const solutions = possibleDateRanges.toSolutions(resourceRequest, firstRequestItem, exactStart, set.resource)
                solutionSet.add(...solutions)


            }
        }

        return solutionSet

    }



    /**
     * 
     * 
     * @param requestItem 
     * @param solutionSet 
     */
    handleResourceRequestItem(requestItem: ResourceRequestItem, solutionSet: SolutionSet, availability: ResourceAvailability, trackInvalidSolutions = false): SolutionSet {


        /**
         * One solution can end up in:
         *  - no solution
         *  - more then 1 solutions
         */
        const resultSolutions = new SolutionSet()


        /**
         * We continue to build further upon existing solutions (solutionSet)
         */

        for (const solution of solutionSet.validSolutions) {

            //const refDate = solution.referenceDate()

            const referenceSolutionItem = solution.items[0]
            const refFrom = referenceSolutionItem.dateRange.from
            const refTo = referenceSolutionItem.dateRange.to

            if (!refFrom)
                throw new Error(`No reference (start) date available`)

            if (referenceSolutionItem.exactStart) {

                const from = dateFns.addSeconds(refFrom, requestItem.offset.seconds)
                const to = dateFns.addSeconds(from, requestItem.duration.seconds)
                const range = new DateRange(from, to)

                const availableResources = availability.getAvailableResourcesInRange(requestItem.resources, range)

                if (availableResources.length > 0) {
                    const solutionItem = new SolutionItem(requestItem, range.clone(), true, ...availableResources)
                    solution.add(solutionItem)

                    resultSolutions.add(solution.clone())

                } else {

                    solution.valid = false

                    if (trackInvalidSolutions)
                        resultSolutions.add(solution)

                }



            } else {
                /* exactStart=false => the reference solution item (first item in solution) is not an exact start, but rather an interval where-in the first request item can start
                It can START in the range [referenceSolutionItem.dateRange.from, referenceSolutionItem.dateRange.to]
                => we need to check the availability of the new requestItem relativly to the above range (see what is possible)
                */

                const startFrom = dateFns.addSeconds(refFrom, requestItem.offset.seconds)
                const startTo = dateFns.addSeconds(refTo, requestItem.offset.seconds)
                const endsOn = dateFns.addSeconds(startTo, requestItem.duration.seconds)

                // const startRange = new DateRange(startFrom, startTo)
                const checkInRange = new DateRange(startFrom, endsOn)

                const availableResources = availability.getAvailabilityOfResourcesInRange(requestItem.resources, checkInRange, requestItem.duration)

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

                        const solutionItem = new SolutionItem(requestItem, availabilityForResource.clone(), false, ...resources)
                        newSolution.add(solutionItem)

                        resultSolutions.add(newSolution)

                    }
                }

                console.warn(availableResources)
                //availability.getAvailability()


            }



        }

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