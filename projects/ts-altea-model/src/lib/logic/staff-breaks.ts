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


    breakTimeTimeSpan(): TimeSpan {

        let staffBreak = TimeSpan.minutes(this.breakTimeInMinutes)

        // to fix some issues during our holiday
        let now = new Date()
        if (now < new Date(2025, 3, 6))
            staffBreak = TimeSpan.minutes(25)

        return staffBreak

    }
    
    breakStillPossible(resourceId: string, allocateForWork: DateRange): StaffBreakPossible {

        const breakRangeSet = this.get(resourceId)

        if (breakRangeSet.isEmpty())  // no break is planned => (no) break is possible
            return new StaffBreakPossible(true)

        const remaining = breakRangeSet.subtractRange(allocateForWork)

        const staffBreak = this.breakTimeTimeSpan()
        //TimeSpan.minutes(this.breakTimeInMinutes)    

        const possibleBreaks = remaining.atLeast(staffBreak)

        return new StaffBreakPossible(possibleBreaks.notEmpty(), remaining)
    }

}

