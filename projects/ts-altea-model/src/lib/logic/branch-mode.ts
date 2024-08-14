import { Schedule } from "ts-altea-model"
import { DateRange } from "./dates";


export class BranchModeRange extends DateRange {


    constructor(from: Date, to: Date, public schedule: Schedule) {
        super(from, to)
    }
}