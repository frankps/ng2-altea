import { DateHelper } from "ts-common"
import { SolutionSet } from "./solution"
import * as dateFns from 'date-fns'

export class ReservationOption {

    /** a reservation option is originating from 1 or more solutions */
    solutionIds : string[] = []

    constructor(public dateNum: number = 0) {
    }

    get date(): Date {
        return DateHelper.parse(this.dateNum)
    }

    static fromDate(start: Date, solutionId?: string): ReservationOption {

        const dateNum = DateHelper.yyyyMMddhhmmss(start)
        const option = new ReservationOption(dateNum)

        if (solutionId)
            option.solutionIds.push(solutionId)

        return option
    }
}

export class ReservationOptionSet {

    // options: ReservationOption[] = []

    constructor(public options: ReservationOption[] = [], public solutionSet: SolutionSet = SolutionSet.empty) {
    }

    static get empty(): ReservationOptionSet {

        return new ReservationOptionSet()
    }

    static fromDates(dates: Date[], solutionId?: string): ReservationOptionSet {

        if (!Array.isArray(dates) || dates.length == 0)
            return ReservationOptionSet.empty

        const options = dates.map(d => ReservationOption.fromDate(d, solutionId))

        return new ReservationOptionSet(options)
    }

    add(...options: ReservationOption[]) {

        if (!Array.isArray(this.options))
            this.options = []

        this.options.push(...options)
    }

    addSet(set: ReservationOptionSet) {
        if (!set)
            return

        this.add(...set.options)
    }

    /** for UI testing: to have some options to click on */
    static createDummy(date: Date = new Date()) {

        const set = ReservationOptionSet.empty


        let startOfDay = dateFns.startOfDay(date)

        for (let hour = 9; hour < 17; hour++) {
            let dateOption = dateFns.addHours(startOfDay, hour)
            const dateNum = DateHelper.yyyyMMddhhmmss(dateOption)
            let option = new ReservationOption(dateNum)
            set.add(option)
        }

        return set

    
    }


}