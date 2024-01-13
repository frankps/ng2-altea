import { DateHelper } from "ts-common";
import { Order } from "../altea-schema";
import { AvailabilityContext } from "./availability-context";
import { ResourceRequest } from "./resource-request";
import { ResourceAvailability } from "./resource-availability";
import * as _ from "lodash"
import * as dateFns from 'date-fns'
import { DateRange } from "./dates";
import { SolutionSet } from "./solution";
import { ReservationOptionSet } from "./reservation-option";

export class AvailabilityRequest {

    /** search for possibilities in the interval [from, to] */
    from = 0   // format: yyyyMMddHHmmss
    to = 0     // format: yyyyMMddHHmmss

    order?: Order

    debug = false

    /** if preferred staff members: supply id's */
    staffIds: string[] = []

    constructor(order?: Order) {
        this.order = order

        this.from = order!.start!
        this.to = order!.start!

    }
}

export class AvailabilityDebugInfo {
    ctx?: AvailabilityContext

    resourceRequests: ResourceRequest[] = []

    optimizedRequest?: ResourceRequest
    availability?: ResourceAvailability
}

export class PossibleSlots {
    slots: SlotInfo[] = []

    constructor(slots: SlotInfo[] = []) {
        this.slots = slots
    }

    static get empty() {
        return new PossibleSlots()
    }

    isEmpty(): boolean {
        return (!Array.isArray(this.slots) || this.slots.length === 0)
    }


    hasSlots(): boolean {
        return (Array.isArray(this.slots) && this.slots.length > 0)
    }

    startDays(): Date[] {

        //  console.error('startDays')

        let dates = this.slots.map(slot => {
            const startDate = slot.startDate

            startDate.getTime()
            startDate.getMilliseconds
            return new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        })


        //     dates = _.uniqBy(dates, {d => dateFns.getTime()} )

        dates = _.uniqBy(dates, 'getTime()')

        //  console.error(dates)

        return dates
    }

    getSlotsForDay(start: Date): SlotInfo[] {

        const end = dateFns.addDays(start, 1)
        const startNum = DateHelper.yyyyMMddhhmmss(start)
        const endNum = DateHelper.yyyyMMddhhmmss(end)

        const slots = this.slots.filter(slot => slot.start >= startNum && slot.start < endNum)

        return slots
    }



}

export class SlotInfo {

    start = 0

    // constructor() {
    // }




    static fromDate(date: Date) {

        const slotInfo = new SlotInfo()
        slotInfo.start = DateHelper.yyyyMMddhhmmss(date)
        return slotInfo

    }

    static fromDateRange(dateRange: DateRange) {

        const slotInfo = new SlotInfo()
        slotInfo.start = DateHelper.yyyyMMddhhmmss(dateRange.from)
        return slotInfo

    }

    get startDate(): Date {
        return DateHelper.parse(this.start)
    }
}

export class AvailabilityResponse {

    optionSet?: ReservationOptionSet

    solutionSet?: SolutionSet

    orders: Order[] = []

    debug = new AvailabilityDebugInfo()

    constructor(orders: Order[] = []) {
        this.orders = orders
    }
}
