import { DateRange, DateRangeSet, TimeSpan } from "../..";


export class StaffBreakPossible {
    constructor(public possible: boolean, public remaining?: DateRangeSet) { }
}

export class StaffBreaks {

    breakTimeInMinutes: number = 40

    breaksByResourceId: Map<string, DateRangeSet> 


    constructor(breaksByResourceId: Map<string, DateRangeSet> = new Map()) {
        this.breaksByResourceId = breaksByResourceId
    }

    get(resourceId: string): DateRangeSet {
        return this.breaksByResourceId.get(resourceId)
    }
    
    breakStillPossible(resourceId: string, allocateForWork: DateRange): StaffBreakPossible {

        const breakRangeSet = this.get(resourceId)

        if (breakRangeSet.isEmpty())  // no break is planned => (no) break is possible
            return new StaffBreakPossible(true)

        const remaining = breakRangeSet.subtractRange(allocateForWork)

        const staffBreak = TimeSpan.minutes(this.breakTimeInMinutes)    

        const possibleBreaks = remaining.atLeast(staffBreak)

        return new StaffBreakPossible(possibleBreaks.notEmpty(), remaining)
    }

}

