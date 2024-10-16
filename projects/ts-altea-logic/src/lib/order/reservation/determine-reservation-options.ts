import { AvailabilityContext, DateRange, DateRangeSet, PlanningBlockSeries, PlanningMode, PossibleSlots, Product, ReservationOption, ReservationOptionSet, Resource, ResourceAvailability, ResourcePlanning, ResourceRequest, ResourceRequestItem, ResourceType, SlotInfo, Solution, SolutionItem, TimeSpan } from "ts-altea-model";
import * as _ from "lodash"
import { ResourceRequestOptimizer } from "./resource-request-optimizer";
import { scheduled } from "rxjs";
import * as dateFns from 'date-fns'
import { SlotFinderBlocks } from "./slot-finder-blocks";
import { SolutionSet } from "ts-altea-model";
import { SlotFinderContinuous } from "./slot-finder-continuous";


export class DetermineReservationOptions {

    static _I: DetermineReservationOptions = new DetermineReservationOptions()

    /** Returns instance of this class */
    static get I(): DetermineReservationOptions {
        return DetermineReservationOptions._I
    }

    getAllReservationOptions(solutionSet: SolutionSet): ReservationOptionSet {

        const result: ReservationOptionSet = new ReservationOptionSet([], solutionSet)

        for (const solution of solutionSet.validSolutions) {

            if (solution.isEmpty())
                continue

            const reservationOptions = this.getReservationOptionsForSolution(solution)
            result.addSet(reservationOptions)

        }

        const uniqResult = this.removeDuplicates(result)

        return uniqResult
    }


    getReservationOptionsForSolution(solution: Solution): ReservationOptionSet {

        if (!solution || solution.isEmpty() || !solution.valid)
            return ReservationOptionSet.empty

        const refItem = solution.items[0]
        let possibleStartDates: Date[] = []

        if (refItem.exactStart)
            possibleStartDates.push(solution.offsetRefDate)
        else {

            if (refItem.dateRange.from.getTime() == refItem.dateRange.to.getTime()) {
                possibleStartDates.push(refItem.dateRange.from)
            } else {
                possibleStartDates = refItem.dateRange.getDatesEvery(TimeSpan.minutes(15))
            }

            
        }
            

        //possibleStartDates = _.sortedUniq(possibleStartDates)   //_.orderBy(possibleStartDates)

        return ReservationOptionSet.fromDates(possibleStartDates, solution.id)
    }

    removeDuplicates(optionSet: ReservationOptionSet): ReservationOptionSet {

        /* to do: give a higher score if there are multiple options for a certain date
         also link back to the solution? => we can create the resourcePlannings much easier !
        */

        let uniqOptions = _.uniqBy(optionSet.options, 'dateNum')
        uniqOptions = _.orderBy(uniqOptions, 'dateNum')
        return new ReservationOptionSet(uniqOptions)
    }

}