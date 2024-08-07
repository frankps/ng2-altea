import * as dateFns from 'date-fns'
import { DateBorder } from './date-border';
import { DateHelper } from 'ts-common';
import { TimeSpan } from './time-span';
import { DateRangeSet } from './date-range-set';

// Source: https://github.com/gund/time-slots/blob/master/packages/time-slots/src/lib

export enum OverlapMode {
    noOverlap,
    exact,
    otherOverlapsFull,
    otherFullWithin,
    otherOverlapsRight,
    otherOverlapsLeft
}

export class DateRange {

    /** quantity is used for resources with multiple instances (multi-cabine) */
    public qty = 1

    constructor(public from: Date, public to: Date, public fromLabels: string[] = [], public toLabels: string[] = []) {
        if (to < from) {
            throw new Error(`DateRange: Date to is smaller than date from!
      From: ${from}
      To: ${to}`);
        }

        /*         if (fromLabel)
                    this.fromLabels.push(fromLabel)
        
                if (toLabel)
                    this.toLabels.push(toLabel) */
    }

    /**
     * @param from ISO Date string
     * @param to ISO Date string
     */
    static fromStrings(from: string, to: string) {
        return this.fromDates(new Date(from), new Date(to));
    }

    static fromDates(from: Date, to: Date) {
        return new DateRange(from, to);
    }

    static fromDateRange(dateRange: DateRange) {
        return dateRange.clone();
    }

    static fromNumbers(from: number, to: number) {

        const fromDate = DateHelper.parse(from)
        const toDate = DateHelper.parse(to)

        return new DateRange(fromDate, toDate);
    }

    static hours(nrOfHours: number, from: Date = new Date()) {
        const to = dateFns.addHours(from, nrOfHours)
        return new DateRange(from, to);
    }

    toString(format: string = 'HH:mm'): string {   //  'dd/MM HH:mm'

        return `[${dateFns.format(this.from, format)}-${dateFns.format(this.to, format)}]`

    }

    get duration(): TimeSpan {

        const dif = dateFns.differenceInSeconds(this.to, this.from)

        return new TimeSpan(dif)
    }

    set duration(value: TimeSpan) {

        if (!value)
            return

        this.to = dateFns.addSeconds(this.from, value.seconds)

    }

    seconds(): number {
        return this.duration.seconds
    }

    // existingPrepBlockEqualOrLonger

    isEqualOrLongerThen(other: DateRange): boolean {
        return (this.seconds() >= other.seconds())

    }

    /*     fromStartOfDay() {
            return dateFns.startOfDay(this.from)
        }
    
        fromStartOfDay() {
            return dateFns.startOfDay(this.from)
        } */

    clone() {
        let clone = new DateRange(new Date(this.from), new Date(this.to));
        clone.fromLabels.push(...this.fromLabels)
        clone.toLabels.push(...this.toLabels)
        return clone
    }

    invert(): DateRangeSet {

        const inverted = new DateRangeSet()
        inverted.addRange(new DateRange(DateHelper.minDate, this.from))
        inverted.addRange(new DateRange(this.to, DateHelper.maxDate))

        return inverted
    }

    fromToNum() {
        return DateHelper.yyyyMMddhhmmss(this.from)
    }

    toToNum() {
        return DateHelper.yyyyMMddhhmmss(this.to)
    }

    increaseToWithSeconds(seconds: number) {
        this.to = dateFns.addSeconds(this.to, seconds)
    }

    getBorders(): DateBorder[] {

        const dateBorders = []

        dateBorders.push(new DateBorder(this.from, true))
        dateBorders.push(new DateBorder(this.to, true))


        return dateBorders
    }

    containsLabels(fromLabel: string, toLabel?: string) {

        const fromOk = fromLabel ? this.fromLabels.indexOf(fromLabel) >= 0 : true
        const toOk = toLabel ? this.toLabels.indexOf(toLabel) >= 0 : true

        return fromOk && toOk
    }

    containsToLabel(toLabel: string) {
        const toOk = toLabel ? this.toLabels.indexOf(toLabel) >= 0 : true
        return toOk
    }



    containsFromLabel(fromLabel: string) {
        const fromOk = fromLabel ? this.fromLabels.indexOf(fromLabel) >= 0 : true
        return fromOk
    }

    /**
     * Returns array of days dates in the range
     */
    takeDays() {
        return this.takeDates(
            () => dateFns.differenceInDays(this.to, this.from),
            (i) => dateFns.addDays(this.from, i),
        );
    }

    /*
    intersectsWith(range: DateRange) {
        const ourFromTime = this.from.getTime();
        const ourToTime = this.to.getTime();
        const theirFromTime = range.from.getTime();
        const theirToTime = range.to.getTime();

        return (
            (ourFromTime <= theirFromTime && ourToTime >= theirFromTime) ||
            (ourFromTime >= theirFromTime && ourFromTime <= theirToTime)
        );
    }
    */

    intersectsWith(range: DateRange) {
        const ourFromTime = this.from.getTime();
        const ourToTime = this.to.getTime();
        const theirFromTime = range.from.getTime();
        const theirToTime = range.to.getTime();

        const notIntersect = theirToTime <= ourFromTime || theirFromTime >= ourToTime

        return !notIntersect
    }

    protected takeDates(
        countExtractor: () => number,
        dateTaker: (n: number) => Date,
    ): Date[] {
        const count = countExtractor();
        const dates = new Array<Date>(count + 1);

        for (let i = 0; i <= count; i++) {
            dates[i] = dateTaker(i);
        }

        return dates;
    }

    isInsideOf(other: DateRange): boolean {
        return (this.from >= other.from && this.to <= other.to)
    }

    contains(other: DateRange): boolean {
        return (this.from <= other.from && this.to >= other.to)
    }


    containsSet(dateRanges: DateRangeSet): boolean {

        if (dateRanges.isEmpty())
            return true

        for (let range of dateRanges.ranges) {

            if (!this.contains(range))
                return false


        }

        return true
    }

    /**
     * How this date range overlaps a secondary date range
     * @param other 
     * @returns 
     */
    overlapWith(other: DateRange): OverlapMode {

        let overlapMode = OverlapMode.noOverlap

        if (other.to <= this.from || other.from >= this.to)
            return OverlapMode.noOverlap

        if (this.from.getTime() === other.from.getTime() && this.to.getTime() === other.to.getTime())
            return OverlapMode.exact

        if (this.from < other.from && this.to > other.to)
            return OverlapMode.otherFullWithin

        if (this.from >= other.from && this.to <= other.to)
            return OverlapMode.otherOverlapsFull

        if (other.from <= this.from && other.to > this.from && other.to < this.to)
            return OverlapMode.otherOverlapsLeft

        if (other.to >= this.to && other.from > this.from && other.from < this.to)
            return OverlapMode.otherOverlapsRight


        throw new Error('overlapWith unforseen situation?')
    }


    subtractSet(set: DateRangeSet): DateRangeSet {

        let result = new DateRangeSet([this.clone()])

        if (set.isEmpty())
            return result

        result = result.subtract(set)

        return result
    }


    subtract(other: DateRange): DateRange[] {
        return DateRange.subtract(this, other)
    }

    static subtract(source: DateRange, other: DateRange): DateRange[] {

        const overlapMode = source.overlapWith(other)

        let ranges = []

        switch (overlapMode) {
            case OverlapMode.noOverlap:  // nothing to subtract
                ranges = [source.clone()]
                break
            case OverlapMode.otherOverlapsFull: // this range is full within the other range => nothing remains
            case OverlapMode.exact:
                ranges = []
                break
            case OverlapMode.otherFullWithin: // full overlap => the other range is within ours => this range will be cut into 2 pieces
                let left = new DateRange(source.from, other.from, source.fromLabels, other.fromLabels)
                let right = new DateRange(other.to, source.to, other.toLabels, source.toLabels)
                ranges = [left, right]
                break
            case OverlapMode.otherOverlapsLeft:  // this range overlaps the other at the end (of this range)
                let newRight = new DateRange(other.to, source.to, other.toLabels, source.toLabels)
                ranges = [newRight]
                break
            case OverlapMode.otherOverlapsRight:  // this range overlaps the other at the start (of this range)
                let newLeft = new DateRange(source.from, other.from, source.fromLabels, other.fromLabels)
                ranges = [newLeft]
                break
        }

        return ranges

    }


    getDatesEvery(time: TimeSpan = TimeSpan.minutes(15)): Date[] {

        const dates = []

        for (let date = this.from; date < this.to; date = time.addToDate(date)) {
            dates.push(date)
        }

        return dates
    }


    // subtractMany(others: DateRange[]) : DateRange[] {


    //     for (const other of others) {

    //     }
    // }

}