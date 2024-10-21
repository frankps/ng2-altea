import { Schedule } from "ts-altea-model"
import { DateRange } from "./dates";


export class BranchModeRange extends DateRange {


    constructor(from: Date, to: Date, schedule: Schedule) {
        super(from, to)
        this.schedule = schedule
    }
}