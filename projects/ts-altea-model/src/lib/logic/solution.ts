import { extend, uniq } from "lodash";
import { Resource, ResourcePlanning, ResourcePlannings, ResourceType } from "ts-altea-model"
import { DateRange, DateRangeSet, TimeSpan } from "./dates";
import { ResourceRequest, ResourceRequestItem } from "./resource-request";
import { ArrayHelper, ObjectHelper, ObjectWithId } from "ts-common";
import * as dateFns from 'date-fns'
import * as _ from "lodash"
import { Type } from "class-transformer";

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

    @Type(() => Resource)
    resources: Resource[] = []

    valid = true

    @Type(() => SolutionNote)
    notes: SolutionNote[] = []

    /** the item number within solution: if items re-ordered, we can still see what original order was */
    num: number = 0

    @Type(() => ResourceRequestItem)
    request: ResourceRequestItem

    @Type(() => DateRange)
    dateRange: DateRange

    constructor(request: ResourceRequestItem, dateRange: DateRange, public exactStart = false, ...resources: Resource[]) {

        this.request = request
        this.dateRange = dateRange

        if (exactStart) {
            if (dateRange.duration.seconds > request.duration.seconds) {
                dateRange.duration = request.duration
            }
        }

        if (Array.isArray(resources))
            this.resources = resources
    }

    containsResource(resourceId: string): boolean {

        if (ArrayHelper.IsEmpty(this.resources))
            return false

        const idx = this.resources.findIndex(res => res.id == resourceId)

        return (idx >= 0)
    }

    clone(): SolutionItem {
        const item = new SolutionItem(this.request, this.dateRange.clone(), this.exactStart, ...this.resources)
        item.notes = this.notes
        return item
    }

    humanResources(): Resource[] {
        if (ArrayHelper.IsEmpty(this.resources))
            return []

        return this.resources.filter(r => r.type == ResourceType.human && !r.isGroup)
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


export class SolutionItems extends ObjectWithId {

    @Type(() => SolutionItem)
    items: SolutionItem[] = []

    constructor(items: SolutionItem[]) {
        super()

        this.items.push(...items)
    }

    humanResources(): Resource[] {

        if (ArrayHelper.IsEmpty(this.items))
            return []

        var resources = this.items.flatMap(item => item.humanResources())

        resources = uniq(resources)

        return resources

    }

    getItemsForResource(resourceId: string): SolutionItems {
        const items = this.items.filter(item => item.containsResource(resourceId))
        return new SolutionItems(items)
    }

    toDateRangeSet(): DateRangeSet {

        const dateRanges = this.items.map(item => item.dateRange)

        const set = new DateRangeSet(dateRanges)

        return set
    }

    getOuterRange(): DateRange {

        if (this.isEmpty())
            return null

        //this.items.find(item => item.dateRange.from)
        const froms = this.items.map(i => i.dateRange.from)
        const tos = this.items.map(i => i.dateRange.to)

        const minFrom = _.min(froms)
        const maxTo = _.max(tos)

        return new DateRange(minFrom, maxTo)

    }

    /**
     * Returns a date range with the minimal from
     * and the corresponding to is incremented with the highest offset+duration
     * @returns 
     */
    getOuterRange2(): DateRange {

        if (this.isEmpty())
            return null

        const dateRanges = this.items.map(i => i.dateRange)
        const minFrom = _.minBy(dateRanges, 'from')  // from

        const endTimesWithinSolution = this.items.map(i => i.request.offset.add(i.request.duration))  //offset
        const maxEndTime = _.maxBy(endTimesWithinSolution, 'seconds')

        const newFrom = minFrom.from
        const newTo = dateFns.addSeconds(minFrom.to, maxEndTime.seconds)

        return new DateRange(newFrom, newTo)

    }


    /** from the start of the earliest request, till the end of the latest request */
    totalRequestDuration(): TimeSpan {

        if (this.isEmpty())
            return new TimeSpan(0)

        let requests = this.items.map(i => i.request)

        let offsets: TimeSpan[] = requests.map(request => request.offset)

        let minOffset = _.minBy(offsets, 'seconds')

        let offsetDurations: TimeSpan[] = requests.map(request => request.offset.add(request.duration))

        let maxOffsetDuration = _.maxBy(offsetDurations, 'seconds')


        let totalDuration = maxOffsetDuration.subtract(minOffset)


        return totalDuration
    }

    /** from the start of the earliest request, till the end of the latest request */
    totalRequestDurationInclOffset(): TimeSpan {

        if (this.isEmpty())
            return new TimeSpan(0)

        let requests = this.items.map(i => i.request)

        let offsets: TimeSpan[] = requests.map(request => request.offset)

        //        let minOffset = _.minBy(offsets, 'seconds')

        let offsetDurations: TimeSpan[] = requests.map(request => request.offset.add(request.duration))

        let maxOffsetDuration = _.maxBy(offsetDurations, 'seconds')

        return maxOffsetDuration
    }




    /*
    occupiedBetween(resource: Resource) : DateRange {

        return new DateRange()


    }*/

    isEmpty(): boolean {
        return ArrayHelper.IsEmpty(this.items)
    }

    notEmpty(): boolean {
        return ArrayHelper.NotEmpty(this.items)
    }
}


/** Short for reservation solution. */
export class Solution extends SolutionItems {

    /** offset reference date: resource planning is always done with an offset to this date (in this solution) */
    offsetRefDate: Date

    //items: SolutionItem[] = []

    valid = true

    @Type(() => SolutionNote)
    notes: SolutionNote[] = []

    /** resource ids for which the breaks have been checked */
    breaksChecked: string[] = []

    constructor(...items: SolutionItem[]) {
        super(items)

        if (ArrayHelper.NotEmpty(items)) {

            let num = 1
            items.forEach(item => { item.num = num++ })

        }
    }

    getSolutionItemForRequestItem(requestId: string) {

        const solItem = this.items.find(item => item.request.id == requestId)

        return solItem
    }

    getSolutionItemSamePerson(personId: string, resType: ResourceType) : SolutionItem {

        var item = this.items.find(item => item.request.samePersonAndResourceType(personId, resType))
        return item
    }

    getHumanResourceItems(): SolutionItems {
        let items = this.items.filter(item => item.resources.findIndex(r => r.type == ResourceType.human && !r.isGroup) >= 0)
        return new SolutionItems(items)
    }

    getOccupationForResource(resource: Resource): DateRangeSet {

        if (this.isEmpty())
            return DateRangeSet.empty

        var itemsForResource = this.items.filter(item => item.resources.find(res => res.id == resource.id))

        if (ArrayHelper.IsEmpty(itemsForResource))
            return DateRangeSet.empty

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

            // important: the to refers to the last possible start of this item (and not to the finished end of this item)
            const refTo = dateFns.addSeconds(item.dateRange.to, -offsetSeconds)

            this.limitOtherItems(refFrom, refTo)
        }

    }

    /*
    [refFrom - refTo] refers to the interval of possible start moments
    (as such refTo has nothing to see with the actual end of a service)
    */
    limitOtherItems(refFrom?: Date, refTo?: Date) {

        if (ArrayHelper.IsEmpty(this.items))
            return

        this.offsetRefDate = refFrom

        for (let item of this.items) {

            const offsetSeconds = item.request.offset.seconds

            if (refFrom)
                item.dateRange.from = dateFns.addSeconds(refFrom, offsetSeconds)

            if (refTo)
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

    /** most likely the reference date is the start date of this solution, but there can be exceptions 
     * example: ref date could be start of wellness session, but massages can be planned before start wellness
    */
    referenceDate(): Date | undefined {

        if (!Array.isArray(this.items) || this.items.length == 0)
            return undefined

        return this.items[0].dateRange.from
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

        
        let clone = ObjectHelper.clone(this, Solution) as Solution
        clone.newId()
        return clone


        /*
        const clone = new Solution(...this.items.map(item => item.clone()))
        clone.valid = this.valid
        clone.notes = [...this.notes]
        clone.offsetRefDate = this.offsetRefDate
        return clone
*/

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

        var solutions = this.solutions.filter(s => !s.isEmpty() && s.valid)

        // because we work with pop() method => by reversing, first element will be popped first
        solutions = solutions.reverse()

        return solutions
    }




    getFirstValid(): Solution {

        if (this.isEmpty())
            return null


        const idx = this.solutions.findIndex(sol => sol.valid)

        if (idx == -1)
            return null

        const firstValidSolution = this.solutions[idx]

        this.solutions.splice(idx, 1)

        return firstValidSolution
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