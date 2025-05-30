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

    count = 0

    /** during certain operations (holiday periods), the solution date range (of wellness) can be different from the requested range. This is flagged here */
    differentFromRequest = false
    difference?: TimeSpan

    constructor(public solution: Solution, request: ResourceRequestItem, dateRange: DateRange, public exactStart = false, public durationFixed = false, ...resources: Resource[]) {

        this.request = request

        /** durationFixed => we should follow the duration coming from dateRange (and not from the request), because dateRanges where previously created based on configuration */
        if (request && dateRange && durationFixed) {

            let requestedDurationSeconds = request.durationInSeconds()
            let actualDurationSeconds = dateRange.duration.seconds

            if (requestedDurationSeconds != actualDurationSeconds) {
                this.request = request.clone()
                //this.request.duration2 = dateRange.duration
                let paramId = request.product.id + '_duration'
                this.solution.overrides.set(paramId, dateRange.duration)

                this.differentFromRequest = true
                this.difference = new TimeSpan(actualDurationSeconds - requestedDurationSeconds)

                solution.differentFromRequest = true
                solution.difference = new TimeSpan(actualDurationSeconds - requestedDurationSeconds)


                let msgParams = {
                    product: request?.product?.name,
                    newDuration: `${dateRange.duration.hours()}u`,
                }

                solution.informCustomer(`duration_change`, msgParams)
            }
        }

        this.dateRange = dateRange

        if (exactStart) {
            if (!durationFixed && dateRange.duration.seconds > request.durationInSeconds(solution)) {
                dateRange.duration = request.duration(solution)
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
        const item = new SolutionItem(this.solution, this.request, this.dateRange.clone(), this.exactStart, this.durationFixed, ...this.resources)
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

    itemsDifferentFromRequest(): SolutionItem[] {

        if (ArrayHelper.IsEmpty(this.items))
            return []

        return this.items.filter(item => item.differentFromRequest)
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

        const endTimesWithinSolution = this.items.map(i => {
            let offset = i.request.offset(i.solution.overrides)
            let duration = i.request.duration(i.solution)
            return offset.add(duration)
        })  //offset

        const maxEndTime = _.maxBy(endTimesWithinSolution, 'seconds')

        const newFrom = minFrom.from
        const newTo = dateFns.addSeconds(minFrom.to, maxEndTime.seconds)

        return new DateRange(newFrom, newTo)

    }


    getFullRanges(): DateRangeSet {

        if (this.isEmpty())
            return DateRangeSet.empty


        const dateRanges = this.items.map(item => {

            let solution = item.solution

            let offset = item.request.offset(solution.overrides)
            let duration = item.request.duration(solution)

            let from = dateFns.addSeconds(solution.offsetRefDate, offset.seconds)
            let to = dateFns.addSeconds(from, duration.seconds)

            from = item.dateRange.from
            to = dateFns.addSeconds(item.dateRange.to, duration.seconds)


            return new DateRange(from, to)
        })

        const set = new DateRangeSet(dateRanges)


        return set
    }


    /** from the start of the earliest request, till the end of the latest request */
    totalRequestDuration(): TimeSpan {

        if (this.isEmpty())
            return new TimeSpan(0)

        // we assume all items come from the same solution
        let solution = this.items[0].solution

        let requests = this.items.map(i => i.request)



        let offsets: TimeSpan[] = requests.map(request => request.offset(solution.overrides))

        let minOffset = _.minBy(offsets, 'seconds')


        let offsetDurations: TimeSpan[] = requests.map(request => {
            let offset = request.offset(solution.overrides)
            let duration = request.duration(solution)
            return offset.add(duration)
        })

        let maxOffsetDuration = _.maxBy(offsetDurations, 'seconds')


        let totalDuration = maxOffsetDuration.subtract(minOffset)


        return totalDuration
    }

    /** from the start of the earliest request, till the end of the latest request */
    totalRequestDurationInclOffset(): TimeSpan {

        if (this.isEmpty())
            return new TimeSpan(0)

        let requests = this.items.map(i => i.request)

        //let offsets: TimeSpan[] = requests.map(request => request.offset(solution))

        //        let minOffset = _.minBy(offsets, 'seconds')
        // we assume all items come from the same solution
        let solution = this.items[0].solution

        let offsetDurations: TimeSpan[] = requests.map(request => {
            let offset = request.offset(solution.overrides)
            let duration = request.duration(solution)
            return offset.add(duration)
        })

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

export class SolutionNotes {
    @Type(() => SolutionNote)
    notes: SolutionNote[] = []

    hasNotes(): boolean {
        return ArrayHelper.NotEmpty(this.notes)
    }

    addNote(content: string, level: SolutionNoteLevel = SolutionNoteLevel.info) {

        const note = new SolutionNote(content, level)
        this.notes.push(note)

    }


}

export class CustomerInfo {

    msg: string
    params: any

    constructor(msg?: string, params?: any) {
        this.msg = msg
        this.params = params
    }


    toString(): string {

        switch (this.msg) {
            case 'products_not_available':

                let plural = this.params.products.length > 1

                let thisProduct = plural ? 'de producten' : 'het product'
                let products = this.params.products.join(', ')

                return `Volgende producten zijn uitzonderlijk niet beschikbaar in de periode ${this.params.period}: ${products}. Kies een datum buiten deze periode of verwijder ${thisProduct}: ${products}.`

            case 'invalid_option_value':
                return `De waarde ${this.params.actual} is niet geldig voor ${this.params.option} tijdens de periode ${this.params.period}.`

            default:
                return this.msg
        }

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

    /** inform customer (ex. duration changes) */
    customerInform: CustomerInfo[] = []

    /** resource ids for which the breaks have been checked */
    breaksChecked: string[] = []

    count = 0

    num: number = -1

    /** during certain operations (holiday periods), the solution date range (ex. of wellness) can be different from the requested range. This is flagged here & also in the SolutionItem */
    differentFromRequest = false

    @Type(() => TimeSpan)
    difference?: TimeSpan

    @Type(() => ResourceRequest)
    request: ResourceRequest


    /** overrides/values for parameters specified in the request */
    @Type(() => Map<string, TimeSpan>)
    overrides: Map<string, TimeSpan> = new Map<string, TimeSpan>()


    planningGroupIdsProcessed: string[] = []


    constructor(request: ResourceRequest, ...items: SolutionItem[]) {
        super(items)

        this.request = request

        if (request?.hasDefaults())
            this.setParamOverrides(request.defaults)

        if (ArrayHelper.NotEmpty(items)) {

            let num = 1
            items.forEach(item => { item.num = num++ })

        }
    }

    /** group level plannings need to be allocated once, therefor we keep track which ones are already processed by solution */
    filterPlanningGroupIdsNotYetProcessed(plannings: ResourcePlannings) : ResourcePlannings {

        if (plannings.isEmpty())
            return plannings

        let result = new ResourcePlannings()

        for (let planning of plannings.plannings) {
            if (!this.planningGroupIdsProcessed.includes(planning.id)) {
                result.push(planning)
                this.planningGroupIdsProcessed.push(planning.id)
            }
        }
        return result
    }



    informCustomer(msg: string, params?: any) {
        this.customerInform.push(new CustomerInfo(msg, params))
    }

    hasCustomerInforms(): boolean {
        return ArrayHelper.NotEmpty(this.customerInform)
    }

    hasParamOverrides(): boolean {

        return this.overrides ? this.overrides.size > 0 : false
    }

    setParamOverrides(defaults: Map<string, TimeSpan>) {

        if (!defaults)
            return

        let params = defaults.keys()

        for (let param of params) {
            let value = defaults.get(param)

            let existing = this.overrides.has(param)

            if (!existing) {

                this.overrides.set(param, value)
            }

        }

    }


    getSolutionItemForRequestItem(requestId: string) {

        const solItem = this.items.find(item => item.request.id == requestId)

        return solItem
    }

    getSolutionItemSamePerson(personId: string, resType: ResourceType): SolutionItem {

        var item = this.items.find(item => item.request.samePersonAndResourceType(personId, resType))
        return item
    }

    getHumanResourceItems(): SolutionItems {
        let items = this.items.filter(item => item.resources.findIndex(r => r.type == ResourceType.human && !r.isGroup) >= 0)
        return new SolutionItems(items)
    }

    getOccupationForResource(resource: Resource, durationAlreadyIncluded: boolean, excludePersonId?: string): DateRangeSet {

        if (this.isEmpty())
            return DateRangeSet.empty

        var itemsForResource = this.items.filter(item => item.resources.find(res => res.id == resource.id) && (!excludePersonId || item.request.personId != excludePersonId))

        if (ArrayHelper.IsEmpty(itemsForResource))
            return DateRangeSet.empty

        var dateRangesForResource = itemsForResource.map(item => {
            let dateRange = item.dateRange.clone()

            if (!durationAlreadyIncluded) {
                /* the date range is the range with possible start dates
                => possible occupation of this solution is this range extended by actual duration of service (that starts on latest possible date)
                */

                dateRange.increaseToWithSeconds(item.request.durationInSeconds(this))
            }

            return dateRange
        })

        if (ArrayHelper.IsEmpty(dateRangesForResource))
            return DateRangeSet.empty

        return new DateRangeSet(dateRangesForResource, resource)
    }

    push(item: SolutionItem) {

        if (!item)
            return

        if (!Array.isArray(this.items))
            this.items = []

        this.items.push(item)
        item.num = this.items.length // keep track when item is added (items can be re-ordered)
        item.count = this.count++
    }



    add(item: SolutionItem, limitOtherItems = true) {


        this.push(item)

        if (!this.hasExactStart() && limitOtherItems) {
            const offsetSeconds = item.request.offsetInSeconds(this.overrides)

            const refFrom = dateFns.addSeconds(item.dateRange.from, -offsetSeconds)

            // important: the to refers to the last possible start of this item (and not to the finished end of this item)
            const refTo = dateFns.addSeconds(item.dateRange.to, -offsetSeconds)

            if (this.offsetRefDate.getTime() != refFrom.getTime()) {
                item.addNote(`Reference date changed: ${dateFns.format(this.offsetRefDate, 'HH:mm')} -> ${dateFns.format(refFrom, 'HH:mm')}`)
            }

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

            const offsetSeconds = item.request.offsetInSeconds(this.overrides)  //.offset.seconds

            if (refFrom) {
                let origFrom = item.dateRange.from
                let newFrom = dateFns.addSeconds(refFrom, offsetSeconds)

                if (origFrom.getTime() != newFrom.getTime()) {
                    item.dateRange.from = newFrom
                    let toStr = dateFns.format(newFrom, 'HH:mm')
                    item.addNote(`Changed from: ${dateFns.format(origFrom, 'HH:mm')} -> ${toStr}`)

                    if (toStr == '15:45' || offsetSeconds / 60 == 135)
                        console.log('Here it is!!')
                }



            }

            if (refTo)
                item.dateRange.to = dateFns.addSeconds(refTo, offsetSeconds)
        }


    }

    addNote(content: string, level: SolutionNoteLevel = SolutionNoteLevel.info) {

        const note = new SolutionNote(content, level)
        this.notes.push(note)

    }

    addNotes(notes: SolutionNote[]) {
        if (ArrayHelper.NotEmpty(notes))
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

        // otherwise we have a circular reference
        this.items.forEach(item => item.solution = null)

        let clone = ObjectHelper.clone(this, Solution) as Solution
        clone.newId()

        this.items.forEach(item => item.solution = this)
        clone.items.forEach(item => item.solution = clone)

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


    getMinimumFromDate(excludePrepTimes: boolean = true) {

        if (ArrayHelper.IsEmpty(this.items))
            return this.offsetRefDate

        let solutionItems = this.items

        if (excludePrepTimes)
            solutionItems = this.items.filter(i => !i.request.isPrepTime)

        if (ArrayHelper.IsEmpty(solutionItems))
            return this.offsetRefDate

        let startDates = solutionItems.map(item => item.dateRange.from)

        let minDate = _.min(startDates)

        return minDate

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


    /**
     * The user might ask for 3hours wellness, but the system might only find a 2.5 hour slot.
     * @returns 
     */
    hasSolutionsDifferentFromRequest(): boolean {

        if (ArrayHelper.IsEmpty(this.solutions))
            return false

        let differentFromRequest = this.solutions.some(s => s.differentFromRequest)

        return differentFromRequest
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

        if (ArrayHelper.IsEmpty(solutions))
            return

        if (!Array.isArray(this.solutions))
            this.solutions = []

        let solutionMaxNum = _.maxBy(this.solutions, 'num')

        let newNum = solutionMaxNum ? solutionMaxNum.num + 1 : 0

        solutions.forEach(sol => sol.num = newNum++)

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