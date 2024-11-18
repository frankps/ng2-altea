import { ArrayHelper, DateHelper } from "ts-common"
import { Solution, SolutionSet } from "./solution"
import * as dateFns from 'date-fns'

export class ReservationOption {

    /** a reservation option is originating from 1 or more solutions */
    solutionIds : string[] = []

    solutions: Solution[] = []

    price: number

    /**
     * 
     * @param dateNum date number in format: yyyyMMddhhmmss
     */
    constructor(public dateNum: number = 0) {
    }

    get date(): Date {
        return DateHelper.parse(this.dateNum)
    }

    isForcedDate() : boolean {
        return ArrayHelper.IsEmpty(this.solutionIds)
    }

    fromSolution() : boolean {
        return ArrayHelper.NotEmpty(this.solutionIds)
    }

    static fromDate(start: Date, solution?: Solution): ReservationOption {

        const dateNum = DateHelper.yyyyMMddhhmmss(start)
        const option = new ReservationOption(dateNum)

        if (solution) {
            option.solutionIds.push(solution.id)
            option.solutions.push(solution)
        }

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

    static fromDates(dates: Date[], solution?: Solution): ReservationOptionSet {

        if (!Array.isArray(dates) || dates.length == 0)
            return ReservationOptionSet.empty

        const options = dates.map(d => ReservationOption.fromDate(d, solution))

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