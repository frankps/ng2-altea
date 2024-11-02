/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DateBorder, DateBorderInfo } from "./date-border"
import { DateRange, OverlapMode } from "./date-range"
import * as _ from "lodash"
import * as dateFns from 'date-fns'
import { ResourceRequest, ResourceRequestItem } from "../resource-request"
import { Solution, SolutionItem, SolutionSet } from "../solution"
import { Resource, ResourcePlanning } from "ts-altea-model"
import { TimeSpan } from "./time-span"
import { ArrayHelper, DateHelper } from "ts-common"

/**
 * This class focuses on pure DB data for a resource (coming from ResourcePlanning)
 * available = extra availabilities (outside schedule), 
 * unAvailable = existing plannings from ResourcePlanning
 * overlapAllowed = existing preparation blocks from ResourcePlanning, where overlap is allowed
 */
export class ResourceOccupationSets {
    constructor(public available: DateRangeSet = DateRangeSet.empty,
        public unAvailable: DateRangeSet = DateRangeSet.empty,
        public overlapAllowed: DateRangeSet = DateRangeSet.empty
    ) {
    }
}

/**
 *  This class focuses on what is available for a resource: available = schedule - occupation
 */
export class ResourceAvailabilitySets {
    constructor(public available: DateRangeSet = DateRangeSet.empty,
        public overlapAllowed: DateRangeSet = DateRangeSet.empty
    ) {
    }
}

export class DateRangeSets {

    constructor(public sets: DateRangeSet[] = []) {

    }

    static get empty(): DateRangeSets {
        return new DateRangeSets()
    }

    isEmpty(): boolean {
        return (!Array.isArray(this.sets) || this.sets.length == 0)
    }

    addSet(set: DateRangeSet) {

        this.sets.push(set)

    }

}

export enum subtractManyMode {
    onlyFullWithin,
    biggestOverlap
}

/** A set contains multiple date ranges */
export class DateRangeSet {

    /** optional: provide resourceId if date ranges are linked to specific resources */
    //resourceId?: string


    constructor(public ranges: DateRange[] = [], public resource?: Resource) {

    }

    static get empty() {
        return new DateRangeSet()
    }

    static init(from: number, to: number, qty: number): DateRangeSet {

        const range = DateRange.init(from, to, qty)

        const set = new DateRangeSet()
        set.addRanges(range)

        return set
    }

    /**
     * If there are ranges with qty > 1, then individual ranges will be returned (qty times) with each qty=1
     * @returns 
     */
    deduplicate(): DateRangeSet {

        const deduplicated: DateRange[] = []

        for (let range of this.ranges) {

            if (!range || range.qty == 0)
                continue

            if (range.qty == 1) {
                deduplicated.push(range.clone())
            } else {

                for (let i = 0; i < range.qty; i++) {
                    let copy = range.clone()
                    copy.qty = 1
                    deduplicated.push(copy)
                }

            }
        }

        return new DateRangeSet(deduplicated)
    }

    setQty(qty: number) {
        if (ArrayHelper.IsEmpty(this.ranges))
            return

        this.ranges.forEach(range => range.qty = qty)
    }


    filterBySchedule(scheduleId: string): DateRangeSet {

        const result = new DateRangeSet([], this.resource)

        if (ArrayHelper.IsEmpty(this.ranges))
            return result

        result.ranges = this.ranges.filter(r => r.schedule?.id == scheduleId)

        return result
    }

    toString(): string {
        if (this.isEmpty())
            return '[]'

        const ranges = this.ranges.map(r => r.toString())

        return '[' + ranges.join(', ') + ']'
    }


    isEmpty(): boolean {
        return ArrayHelper.IsEmpty(this.ranges)
    }

    notEmpty(): boolean {
        return ArrayHelper.NotEmpty(this.ranges)
    }

    clone(): DateRangeSet {

        if (this.isEmpty())
            return new DateRangeSet()


        const clones = this.ranges.map(r => r.clone())
        const set = new DateRangeSet(clones)
        set.resource = this.resource

        return set
    }

    addRanges(...ranges: DateRange[]) {
        this.ranges.push(...ranges)
    }

    addRangeByDates(from: Date, to: Date, fromLabel?: string, toLabel?: string): DateRange {

        const range = new DateRange(from, to, [fromLabel], [toLabel])
        this.addRanges(range)

        return range

    }


    outerRange(): DateRange {

        if (ArrayHelper.IsEmpty(this.ranges))
            return null

        const min = _.minBy(this.ranges, 'from')
        const max = _.minBy(this.ranges, 'to')

        return new DateRange(min.from, max.to)
    }

    /** check if this.ranges contains at least 1 range that contains  */
    contains(range: DateRange): boolean {

        const idx = this.ranges.findIndex(r => range.from >= r.from && range.to <= r.to)   //range.to > r.from && range.from < r.to

        return (idx >= 0)
    }

    fromDays(): Date[] {

        let dates = this.ranges.map(r => new Date(r.from.getFullYear(), r.from.getMonth(), r.from.getDate()))

        // console.error(dates)


        dates = _.uniqBy(dates, DateHelper.yyyyMMdd)

        /*         if (ArrayHelper.NotEmpty(dates) && dates.length > 1)
                    console.warn(`fromDays()`, dates) */

        //  console.error(dates)

        return dates
    }

    getRangeStartingAt(from: Date): DateRange {

        return this.ranges.find(r => r.from.getTime() === from.getTime())

    }

    getRangesForDay(start: Date): DateRange[] {

        const end = dateFns.addDays(start, 1)

        const ranges = this.ranges.filter(r => r.from >= start && r.from < end)

        return ranges
    }

    getRangesForSameDay(day: Date): DateRangeSet {

        const start = dateFns.startOfDay(day)
        const end = dateFns.addDays(start, 1)

        const ranges = this.ranges.filter(r => r.from >= start && r.from < end)

        return new DateRangeSet(ranges)
    }



    getDateBorders(): DateBorder[] {

        const dateBorders: DateBorder[] = []

        if (!Array.isArray(dateBorders))
            return dateBorders

        for (const range of this.ranges) {
            dateBorders.push(...range.getBorders())
        }

        return dateBorders

    }

    hasOverlapWithSet(overlapWith: DateRangeSet): boolean {

        for (let range of overlapWith.ranges) {

            if (this.hasOverlapWith(range))
                return true
        }

        return false

    }

    hasOverlapWith(overlapWith: DateRange): boolean {

        if (this.isEmpty() || overlapWith == null)
            return false

        for (let range of this.ranges) {

            let mode = range.overlapWith(overlapWith)

            if (mode != OverlapMode.noOverlap)
                return true
        }

        return false

    }
    filterOverlappingRanges(overlapWith: DateRange): DateRangeSet {

        const overlaps = new DateRangeSet()

        if (this.isEmpty() || overlapWith == null)
            return overlaps

        for (let range of this.ranges) {

            let mode = range.overlapWith(overlapWith)

            if (mode != OverlapMode.noOverlap)
                overlaps.addRanges(range)
        }

        return overlaps

    }

    getRangeWhereToEquals(to: Date) {
        const match = this.ranges.find(r => dateFns.isEqual(r.to, to))
        return match
    }

    getRangeWhereFromEquals(from: Date) {
        const match = this.ranges.find(r => dateFns.isEqual(r.from, from))
        return match
    }


    clip(insideRange: DateRange): DateRangeSet {

        if (this.isEmpty())
            return DateRangeSet.empty


        const outsideRanges = insideRange.invert()

        //const result = new DateRangeSet()

        let result = this.subtract(outsideRanges, true)

        return result
    }

    atLeast(time: TimeSpan): DateRangeSet {

        const ranges = this.ranges.filter(r => r.duration.seconds >= time.seconds)

        if (!Array.isArray(ranges) || ranges.length == 0)
            return DateRangeSet.empty

        return new DateRangeSet(ranges.map(r => r.clone()), this.resource)
    }

    get count() {
        if (ArrayHelper.IsEmpty(this.ranges))
            return 0

        return this.ranges.length
    }

    allAtLeast(time: TimeSpan): boolean {

        const idx = this.ranges.findIndex(r => r.duration.seconds < time.seconds)

        return idx == -1
    }

    lessThen(time: TimeSpan): DateRangeSet {

        const ranges = this.ranges.filter(r => r.duration.seconds < time.seconds)

        if (!Array.isArray(ranges) || ranges.length == 0)
            return DateRangeSet.empty

        return new DateRangeSet(ranges.map(r => r.clone()), this.resource)
    }


    minimum(minTime: TimeSpan): DateRangeSet {

        const minRanges = this.ranges.filter(r => r.duration.seconds >= minTime.seconds)

        if (!Array.isArray(minRanges) || minRanges.length == 0)
            return DateRangeSet.empty

        return new DateRangeSet(minRanges.map(r => r.clone()), this.resource)
    }

    add(set: DateRangeSet): DateRangeSet {
        let allRanges: DateRange[] = []

        if (Array.isArray(this.ranges))
            allRanges.push(...this.ranges)

        if (Array.isArray(set.ranges))
            allRanges.push(...set.ranges)

        if (allRanges.length == 0)
            return DateRangeSet.empty

        allRanges = _.orderBy(allRanges, ['from', 'to'])


        return new DateRangeSet(allRanges)
    }

    /** used for multi-instance resources (resource.qty > 1), then we know how many resources are free/occupied.
     * DataRange.qty is used to keep track of how many resources are occupied
    */
    sumUp() {
        // let rangesOrdered = _.orderBy(this.ranges, ['from', 'to'])

        const result = DateRangeSet.empty

        let allFroms = this.ranges.map(r => r.from)
        let allTos = this.ranges.map(r => r.to)

        let allBorders = [...allFroms, ...allTos]



        //   hier probleem !!! ...DateBorder  _.uniqBy(dates, 'getTime()')

        let times = allBorders.map(d => d.getTime())
        console.log(times)

        allBorders = _.uniqBy(allBorders, d => d.getTime()) // _.uniq(allBorders, )
        allBorders = allBorders.sort()

        for (let i = 0; i < allBorders.length - 1; i++) {
            const from = allBorders[i]
            const to = allBorders[i + 1]

            const inRange = this.ranges.filter(range => range.from <= from && from < range.to)
            const qtyInRange = inRange.length

            let newRange = new DateRange(from, to)
            newRange.qty = qtyInRange

            result.addRanges(newRange)

        }

        return result
    }

    removeRangesWithQtyLowerThen(qty: number): DateRangeSet {
        const ranges = this.ranges.filter(range => range.qty >= qty)
        return new DateRangeSet(ranges)
    }

    removeRangesWithMinQty(qty: number): DateRangeSet {
        const ranges = this.ranges.filter(range => range.qty < qty)
        return new DateRangeSet(ranges)
    }

    union(set?: DateRangeSet): DateRangeSet {

        //to implement !!
        let allRanges: DateRange[] = []
        const result: DateRange[] = []

        if (Array.isArray(this.ranges))
            allRanges.push(...this.ranges)

        if (set && Array.isArray(set.ranges))
            allRanges.push(...set.ranges)

        if (allRanges.length == 0)
            return DateRangeSet.empty

        allRanges = _.orderBy(allRanges, ['from', 'to'])

        let previousRange = allRanges[0]

        for (let i = 1; i < allRanges.length; i++) {

            const nextRange = allRanges[i]

            // remark, always TRUE: previousRange.from <= nextRange.from  (because ordered by from)

            if (nextRange.from > previousRange.to) {
                result.push(previousRange.clone())
                previousRange = nextRange
            }
            else {
                const maxTo: Date = nextRange.to > previousRange.to ? nextRange.to : previousRange.to
                previousRange = new DateRange(previousRange.from, maxTo)
            }
        }

        result.push(previousRange.clone())

        // this.ranges = result
        return new DateRangeSet(result)
    }


    flatten(): DateRangeSet {
        return this
    }


    subtractByDates(from: Date | number, to: Date | number): DateRangeSet {

        let fromDate = from instanceof Date ? from : DateHelper.parse(from)
        let toDate = to instanceof Date ? to : DateHelper.parse(to)

        let range = new DateRange(fromDate, toDate)
        let set = new DateRangeSet([range])

        return this.subtract(set)

    }

    subtractAll(timeSpan: TimeSpan): DateRangeSet {

        if (this.isEmpty())
            return new DateRangeSet()

        const result = new DateRangeSet()

        for (let range of this.ranges) {

            if (range.seconds() <= timeSpan.seconds)
                continue

            const newRange = range.subtractTimeSpan(timeSpan)

            //if (newRange.isValid())
            result.addRanges(newRange)
        }

        return result
    }


    subtractRange(range: DateRange): DateRangeSet {

        const toSubtract = new DateRangeSet([range])

        return this.subtract(toSubtract)

    }

    indexOfRangeContaining(other: DateRange): number {

        if (ArrayHelper.IsEmpty(this.ranges))
            return -1

        let idx = 0
        for (let range of this.ranges) {
            if (range.contains(other))
                return idx
            idx++
        }

        return -1
    }

    indexOfRangeBiggestOverlap(other: DateRange): number {
        if (ArrayHelper.IsEmpty(this.ranges))
            return -1


        let overlapsInSeconds = this.ranges.map(range => range.section(other)?.duration.seconds)

        // replace undefined by 0
        overlapsInSeconds = overlapsInSeconds.map(sec => sec?sec:0)

        const maxValue = Math.max(...overlapsInSeconds);

        if (!maxValue || maxValue <= 0)
            return -1

        const idxMaxValue = overlapsInSeconds.indexOf(maxValue); 

        return idxMaxValue
    }

    removeRangeAtIndex(idx: number) {

        if (ArrayHelper.IsEmpty(this.ranges))
            return null

        let length = this.ranges.length

        if (idx < 0 || idx >= length)
            return null

        let removed = this.ranges.splice(idx, 1)

        if (removed?.length == 1)
            return removed[0]
        else
            return null
    }

    subtractMany(setToSubtract: DateRangeSet, mode: subtractManyMode = subtractManyMode.biggestOverlap) : DateRangeSet {

        let subtractFrom = this.clone()

        let toSubtractDedup = setToSubtract.deduplicate()

        for (let rangeToSubtract of toSubtractDedup.ranges) {

            let idx = subtractFrom.indexOfRangeContaining(rangeToSubtract)


            if (idx == -1 && mode == subtractManyMode.biggestOverlap) {
                idx = subtractFrom.indexOfRangeBiggestOverlap(rangeToSubtract)
            }

            if (idx == -1)
                continue

            let substractFrom = subtractFrom.ranges[idx]
            subtractFrom.removeRangeAtIndex(idx)

            // if qty > 1, then we need to keep all but one
            if (substractFrom.qty > 1) {
                let substractFromQtyMinus1 = substractFrom.clone()
                substractFromQtyMinus1.qty--
                subtractFrom.addRanges(substractFromQtyMinus1)
            }

            if (!substractFrom.equals(rangeToSubtract)) {

                let diff = substractFrom.subtract(rangeToSubtract)
                subtractFrom.addRanges(...diff)

            }
        }

        return subtractFrom


    }



    /**
     * 
     * @param toSubtract 
     * @param substractFromAllRanges   if range.qty > 1 (=multiple ranges), then we subtract from all ranges if true, else from single range 
     * @returns 
     */
    subtract(toSubtract: DateRangeSet, substractFromAllRanges: boolean = false): DateRangeSet {

        if (this.isEmpty())
            return DateRangeSet.empty

        if (!toSubtract || toSubtract.isEmpty())
            return this.clone()

        const source = _.orderBy(this.ranges, ['from', 'to'])

        const substractFromRanges: DateRange[] = []
        for (const range of source) substractFromRanges.push(range)

        const toSubtractRanges = _.orderBy(toSubtract.ranges, ['from', 'to'])

        //while ()


        const subtractResults: DateRange[] = []


        let subtractFrom: DateRange = substractFromRanges.pop()

        // is qty > 1, then we only subtract from the first
        if (!substractFromAllRanges && subtractFrom.qty > 1) {

            //if (subtractFrom.qty > )

            let untouched = subtractFrom.clone()
            untouched.qty = untouched.qty - 1
            subtractResults.push(untouched)

            // we continue with just 1
            subtractFrom = subtractFrom.clone()
            subtractFrom.qty = 1
        }

        while (subtractFrom) {

            const overlappingRanges = toSubtractRanges.filter(toSubtract => subtractFrom!.intersectsWith(toSubtract))

            for (const overlappingRange of overlappingRanges) {
                const minusResults = DateRange.subtract(subtractFrom, overlappingRange)
                const nrOfResults = minusResults.length

                if (nrOfResults == 1)
                    subtractFrom = minusResults[0]
                else if (nrOfResults == 0) {// there was a full overlap, no date range left over
                    subtractFrom = null
                    break
                }
                else  // nrOfResults == 2 => subtractFrom was split in 2 
                {
                    subtractResults.push(minusResults[0].clone())
                    // we assume no overlaps anymore with minusResults[0] -> the next possible overlappingRange will be more in the future (because they were ordered)
                    subtractFrom = minusResults[1]
                }

            }

            //  const res = subtractFrom?.subtract()

            if (subtractFrom)
                subtractResults.push(subtractFrom.clone())

            subtractFrom = substractFromRanges.pop()
        }


        return new DateRangeSet(subtractResults, this.resource)

    }


    /**
 *  Creates for each date range in this.ranges a solution
 * 
 *  Was created for booking fixed block services (such as Wellness slots),
 *  then we typically have some possible intervals where it's possible (dateRanges),
 *  and for each interval we create a solution.
 * 
 *  for compound orders (example a massage after a wellness), extra logic down the pipeline will consider each of these solutions
 *  and check if extra services (or resource plannings) can be added as extra solution items to each of the solutions.
 * 
 * @param requestItem 
 * @param dateRanges 
 * @returns 
 */
    toSolutions(request: ResourceRequest, requestItem: ResourceRequestItem, exactStart: boolean, resource?: Resource): Solution[] {


        if (this.isEmpty())
            return []

        const solutions = this.ranges.map(range => {

            // we create a solution with 1 solutionItem, because this will be a starting solution where 
            // other solutionItems will be added later on
            const solutionItem = new SolutionItem(requestItem, range, exactStart)

            if (resource)
                solutionItem.resources.push(resource)

            const solution = new Solution(solutionItem)
            solution.offsetRefDate = range.from

            return solution
        })

        return solutions  //new SolutionSet(...solutionItems)

    }


}