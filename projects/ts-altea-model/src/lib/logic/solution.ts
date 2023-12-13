import { extend } from "lodash";
import { Resource, ResourcePlanning, ResourcePlannings } from "../altea-schema";
import { DateRange, DateRangeSet, TimeSpan } from "./dates";
import { ResourceRequestItem } from "./resource-request";
import { ObjectWithId } from "ts-common";



/**
 * A solution item is a possible solution for a resource request item (request) => the requested resource is available during the date range
 * This can be an exact slot (if exactStart = true), or this can be a bigger (floating) slot during wich the resource is available. 
 */
export class SolutionItem {

    resources: Resource[] = []

    constructor(public request: ResourceRequestItem, public dateRange: DateRange, public exactStart = false, ...resources: Resource[]) {
        if (Array.isArray(resources))
            this.resources = resources
    }

    clone(): SolutionItem {
        return new SolutionItem(this.request, this.dateRange.clone(), this.exactStart, ...this.resources)
    }
}


/** Short for reservation solution. */
export class Solution extends ObjectWithId {

    items: SolutionItem[] = []

    valid = true

    constructor(...items: SolutionItem[]) {
        super()
        this.items.push(...items)
    }

    add(item: SolutionItem) {

        if (!Array.isArray(this.items))
            this.items = []

        this.items.push(item)
    }

    /** most likely the reference date is the start date of this solution, but there can be exceptions */
    referenceDate(): Date | undefined {

        if (!Array.isArray(this.items) || this.items.length == 0)
            return undefined

        return this.items[0].dateRange.from
    }

    isEmpty(): boolean {
        return (!Array.isArray(this.items) || this.items.length == 0)
    }

    hasItems(): boolean {
        return (Array.isArray(this.items) && this.items.length > 0)
    }


    hasExactStart(): boolean {

        if (this.isEmpty())
            return false

        return this.items[0].exactStart

    }

    clone(): Solution {

        const clone = new Solution(...this.items.map(item => item.clone()))
        clone.valid = this.valid
        return clone

    }

    /**
     * some solution items can have floating intervals (exactStart=false, then the service can start at any time within the interval)
     */
    toExactSolutions(): Solution[] {
        if (this.isEmpty())
            return [this]


        if (this.hasExactStart())
            return [this]


        const firstItem = this.items[0]

        const startDates = firstItem.dateRange.getDatesEvery(TimeSpan.minutes(15))

        const exactSolutions = []

        for (const startDate of startDates) {

            const newSolution = this.clone()
            const newFirstItem = newSolution.items[0]
            newFirstItem.dateRange.from = startDate

            exactSolutions.push(newSolution)
        }


        /** 
         
    findContinuousSlots(dateRange: DateRange, slots: SlotInfo[]) {

        const startDates = dateRange.getDatesEvery(TimeSpan.minutes(15))

        slots.push(...startDates.map(date => SlotInfo.fromDate(date)))

    }



        */


        // so we have a floating start => we split the given interval
        return exactSolutions
    }


}



export class SolutionSet {

    solutions: Solution[] = []

    constructor(...solutions: Solution[]) {
        this.solutions.push(...solutions)
    }

    static get empty(): SolutionSet {

        return new SolutionSet()
    }

    get validSolutions(): Solution[] {
        return this.solutions.filter(s => !s.isEmpty() && s.valid)
    }


    add(...solutions: Solution[]) {

        if (!Array.isArray(this.solutions))
            this.solutions = []



        this.solutions.push(...solutions)
    }

    getSolutionById(solutionId: string): Solution | undefined {

        return this.solutions.find(s => s.id == solutionId)
    }

    isEmpty(): boolean {
        return (!Array.isArray(this.solutions) || this.solutions.length == 0)
    }

    toExactSolutions(): SolutionSet {

        if (this.isEmpty())
            return this

        const exactSolutions = this.solutions.flatMap(s => s.toExactSolutions())

        return new SolutionSet(...exactSolutions)
    }



}