import { AvailabilityContext, DateRange, DateRangeSet, PlanningBlockSeries, PlanningMode, PossibleSlots, Product, Resource, ResourcePlanning, ResourceRequest, ResourceRequestItem, ResourceType, SlotInfo, Solution, SolutionItem, TimeSpan } from "ts-altea-model";
import * as _ from "lodash"
import { ResourceRequestOptimizer } from "./resource-request-optimizer";
import { scheduled } from "rxjs";
import * as dateFns from 'date-fns'
import { SlotFinderBlocks } from "./slot-finder-blocks";
import { SolutionSet } from "ts-altea-model";
import { SlotFinderContinuous } from "./slot-finder-continuous";


export class SolutionPicker {

    static _I: SolutionPicker = new SolutionPicker()

    /** Returns instance of this class */
    static get I(): SolutionPicker {
        return SolutionPicker._I
    }

    pickAllBestSolutions(solutionSet: SolutionSet, trackInvalidSolutions = false): SolutionSet {

        const result: SolutionSet = new SolutionSet()

        for (const solution of solutionSet.solutions) {

            if (solution.isEmpty())
                continue

            if (solution.valid) {
                const bestSolutions = this.pickBestSolutions(solution)
                result.add(...bestSolutions)
            } else {

                // an invalid solution: a solution becomes invalid when a certain resource request can not be fullfilled
                if (trackInvalidSolutions)
                    result.add(solution)
            }

        }

        return result
    }


    pickBestSolutions(solution: Solution): Solution[] {

        const resultSolutions: Solution[] = []

        resultSolutions.push(solution)

        return resultSolutions
    }


}