import { ArrayHelper, DateHelper } from "ts-common"
import { Solution, SolutionSet } from "./solution"
import * as dateFns from 'date-fns'
import { Order } from "ts-altea-model"


export class ReservationOption {

    /** a reservation option is originating from 1 or more solutions */
    solutionIds : string[] = []

    solutions: Solution[] = []

    price: number

    /**  */
    informIdx: number[] = []

    /** only set when order is changed by planning logic (ex original request: Wellness 3h, but planning changed to 2h) 
     * 
    */
    order: Order

    /** when a specific time-slot is forced (user doesn't take slot proposed by system) */
    forced: boolean = false

    /**
     * 
     * @param dateNum date number in format: yyyyMMddhhmmss
     */
    constructor(public dateNum: number = 0) {
    }

    get date(): Date {
        return DateHelper.parse(this.dateNum)
    }

    hasInforms(): boolean {
        return ArrayHelper.NotEmpty(this.informIdx)
    }

/*     isForcedDate() : boolean {
        return ArrayHelper.IsEmpty(this.solutionIds)
    } */

    fromSolution() : boolean {
        return ArrayHelper.NotEmpty(this.solutionIds)
    }

    firstSolution() : Solution {

        if (ArrayHelper.IsEmpty(this.solutions))
            return null

        return this.solutions[0]
    }

    static fromDate(start: Date, solution?: Solution, forced: boolean = false): ReservationOption {

        const dateNum = DateHelper.yyyyMMddhhmmss(start)
        const option = new ReservationOption(dateNum)

        if (solution) {
            option.solutionIds.push(solution.id)
            option.solutions.push(solution)
        }

        option.forced = forced

        return option
    }
}

export class ReservationOptionSet {

    /** messages to be displayed to customer */
    informs: string[] = []

    constructor(public options: ReservationOption[] = [], public solutionSet: SolutionSet = SolutionSet.empty) {
    }

    static get empty(): ReservationOptionSet {

        return new ReservationOptionSet()
    }

    hasInforms(): boolean {
        return ArrayHelper.NotEmpty(this.informs)
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



    compileMessages() {

        this.informs = []

        if (ArrayHelper.IsEmpty(this.options))
          return
    
        for (let option of this.options) {

            let solution = option.firstSolution()

            if (!solution || !solution.hasCustomerInforms())
                continue


            for (let inform of solution.customerInform) {

                let msg

                switch (inform.msg) {
                    case 'duration_change':
                        msg = `Duurtijd voor ${inform.params.product} is uitzonderlijk ${inform.params.newDuration}`
                        break


                    default:
                        console.error(`Not supported message`)
                }

                let idx = this.informs.indexOf(msg)

                if (idx == -1)
                    idx = this.informs.push(msg) - 1
                
                option.informIdx.push(idx)
            }


        }
        /*
        let solutions = this.options.map(option => option.firstSolution())
    
    
        for (let solution of solutions) {
          if (solution.customerInform) {
            messages.push(...solution.customerInform)
          }
        }
    
        return messages
        */
      }







}