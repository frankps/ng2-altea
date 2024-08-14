import { extend } from "lodash";
import { Resource, ResourcePlanning, ResourcePlannings } from "ts-altea-model"
import { DateRange, DateRangeSet, TimeSpan } from "./dates";
import { ResourceRequestItem } from "./resource-request";
import { ArrayHelper, ObjectHelper, ObjectWithId } from "ts-common";
import * as dateFns from 'date-fns'

export enum SolutionNoteLevel {
    info,
    blocking
}

export class SolutionNote {

    constructor(public content: string, public level: SolutionNoteLevel = SolutionNoteLevel.info) {

    }

}


/**
 * A solution item is a possible solution for a resource request item (request) => the requested resource is available during the date range
 * This can be an exact slot (if exactStart = true), or this can be a bigger (floating) slot during wich the resource is available. 
 */
export class SolutionItem {

    resources: Resource[] = []

    valid = true

    notes: SolutionNote[] = []

    /** the item number within solution: if items re-ordered, we can still see what original order was */
    num: number = 0

    constructor(public request: ResourceRequestItem, public dateRange: DateRange, public exactStart = false, ...resources: Resource[]) {

        if (exactStart) {
            if (dateRange.duration.seconds > request.duration.seconds) {
                dateRange.duration = request.duration
            }
        }

        if (Array.isArray(resources))
            this.resources = resources
    }

    clone(): SolutionItem {
        const item = new SolutionItem(this.request, this.dateRange.clone(), this.exactStart, ...this.resources)
        item.notes = this.notes
        return item
    }

    addNote(content: string, level: SolutionNoteLevel = SolutionNoteLevel.info) {

        const note = new SolutionNote(content, level)
        this.notes.push(note)

    }

    addNotes(notes: SolutionNote[]) {
        if (Array.isArray(notes) && notes.length > 0)
            this.notes.push(...notes)
    }
}


/** Short for reservation solution. */
export class Solution extends ObjectWithId {

    /** offset reference date: resource planning is always done with an offset to this date (in this solution) */
    offsetRefDate: Date

    items: SolutionItem[] = []

    valid = true

    notes: SolutionNote[] = []

    constructor(...items: SolutionItem[]) {
        super()

        if (ArrayHelper.NotEmpty(items)) {
            this.items.push(...items)

            let num = 1
            items.forEach(item => { item.num = num++ })

        }
    }

    getOccupationForResource(resource: Resource): DateRangeSet {

        if (this.isEmpty())
            return DateRangeSet.empty

        var itemsForResource = this.items.filter(item => item.resources.find(res => res.id == resource.id))

        var dateRangesForResource = itemsForResource.map(item => {
            let dateRange = item.dateRange.clone()

            /* the date range is the range with possible start dates
            => possible occupation of this solution is this range extended by actual duration of service (that starts on latest possible date)
            */

            dateRange.increaseToWithSeconds(item.request.duration.seconds)
            return dateRange
        })

        if (ArrayHelper.IsEmpty(dateRangesForResource))
            return DateRangeSet.empty

        return new DateRangeSet(dateRangesForResource, resource)
    }




    add(item: SolutionItem, limitOtherItems = true) {

        if (!item)
            return

        if (!Array.isArray(this.items))
            this.items = []

        this.items.push(item)
        item.num = this.items.length // keep track when item is added (items can be re-ordered)

        if (!this.hasExactStart() && limitOtherItems) {
            const offsetSeconds = item.request.offset.seconds

            const refFrom = dateFns.addSeconds(item.dateRange.from, -offsetSeconds)
            const refTo = dateFns.addSeconds(item.dateRange.to, -offsetSeconds)

            this.limitOtherItems(refFrom, refTo)
        }

    }

    limitOtherItems(refFrom: Date, refTo: Date) {

        if (ArrayHelper.IsEmpty(this.items))
            return


        for (let item of this.items) {

            const offsetSeconds = item.request.offset.seconds

            item.dateRange.from = dateFns.addSeconds(refFrom, offsetSeconds)
            item.dateRange.to = dateFns.addSeconds(refTo, offsetSeconds)
        }


    }

    addNote(content: string, level: SolutionNoteLevel = SolutionNoteLevel.info) {

        const note = new SolutionNote(content, level)
        this.notes.push(note)

    }

    addNotes(notes: SolutionNote[]) {
        if (Array.isArray(notes) && notes.length > 0)
            this.notes.push(...notes)
    }

    /** most likely the reference date is the start date of this solution, but there can be exceptions */
    referenceDate(): Date | undefined {

        if (!Array.isArray(this.items) || this.items.length == 0)
            return undefined

        return this.items[0].dateRange.from
    }

    isEmpty(): boolean {
        return ArrayHelper.IsEmpty(this.items)
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

        //    return ObjectHelper.clone(this, Solution) as Solution

        const clone = new Solution(...this.items.map(item => item.clone()))
        clone.valid = this.valid
        clone.notes = this.notes
        clone.offsetRefDate = this.offsetRefDate
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