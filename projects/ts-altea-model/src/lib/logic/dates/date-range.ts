import * as dateFns from 'date-fns'
import { DateBorder } from './date-border';
import { DateHelper } from 'ts-common';
import { TimeSpan } from './time-span';
import { DateRangeSet } from './date-range-set';

// Source: https://github.com/gund/time-slots/blob/master/packages/time-slots/src/lib


export enum OverlapMode {
    noOverlap,
    fullOverlap,
    fullWithin,
    endOverlap,
    beginOverlap
}

export class DateRange {

    constructor(public from: Date, public to: Date) {
        if (to < from) {
            throw new Error(`DateRange: Date to is smaller than date from!
      From: ${from}
      To: ${to}`);
        }
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

    get duration(): TimeSpan {

        const dif = dateFns.differenceInSeconds(this.to, this.from)

        return new TimeSpan(dif)
    }

    clone() {
        return new DateRange(new Date(this.from), new Date(this.to));
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

    changeTo(seconds: number) {
        this.to = dateFns.addSeconds(this.to, seconds)
    }

    getBorders(): DateBorder[] {

        const dateBorders = []

        dateBorders.push(new DateBorder(this.from, true))
        dateBorders.push(new DateBorder(this.to, true))


        return dateBorders
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


    /**
     * How this date range overlaps a secondary date range
     * @param secondary 
     * @returns 
     */
    overlapWith(secondary: DateRange): OverlapMode {

        let overlapMode = OverlapMode.noOverlap

        if (this.from <= secondary.from) {

            if (this.to >= secondary.to)
                overlapMode = OverlapMode.fullOverlap
            else if (this.to <= secondary.from)
                overlapMode = OverlapMode.noOverlap
            else
                overlapMode = OverlapMode.endOverlap

        } else {

            if (this.to < secondary.to)
                overlapMode = OverlapMode.fullWithin
            else if (this.from >= secondary.to)
                overlapMode = OverlapMode.noOverlap
            else
                overlapMode = OverlapMode.beginOverlap

        }

        return overlapMode
    }


    subtractSet(set: DateRangeSet): DateRangeSet {

        return DateRangeSet.empty
    }


    subtract(other: DateRange): DateRange[] {
        return DateRange.subtract(this, other)
    }

    static subtract(source: DateRange, other: DateRange): DateRange[] {

        const overlapMode = source.overlapWith(other)

        switch (overlapMode) {
            case OverlapMode.noOverlap:  // nothing to subtract
                return [source.clone()]
            case OverlapMode.fullWithin: // this range is full within the other range => nothing remains
                return []
            case OverlapMode.fullOverlap: // full overlap => the other range is within ours => this range will be cut into 2 pieces
                return [new DateRange(source.from, other.from), new DateRange(other.to, source.to)]
            case OverlapMode.endOverlap:  // this range overlaps the other at the end (of this range)
                return [new DateRange(source.from, other.from)]
            case OverlapMode.beginOverlap:  // this range overlaps the other at the start (of this range)
                return [new DateRange(other.to, source.to)]

        }

        return []

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