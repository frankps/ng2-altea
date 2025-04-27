import { ArrayHelper, DateHelper, ObjectHelper } from "ts-common"
import { Job } from "./job"
import { DateRange } from "../logic"
import { Type } from "class-transformer"

export enum EventType {
    wellness_start = 'wellness_start',
    wellness_end = 'wellness_end',
    door_enable = 'door_enable',
    door_disable = 'door_disable',
    sauna_start = 'sauna_start',
    sauna_end = 'sauna_end',
}

export class Event {
    id: string
    type: string
    date: number
    resourceId?: string
    orderId?: string
    contactId?: string
    contactName?: string
    custom?: any

    @Type(() => Job)
    jobs: Job[]

    constructor(type: string, date: number, resourceId?: string, orderId?: string, contactId?: string, contactName?: string) {

        /*  if (id)
             this.id = id
         else */
        this.id = ObjectHelper.newGuid()

        this.type = type
        this.date = date
        this.resourceId = resourceId
        this.orderId = orderId
        this.contactId = contactId
        this.contactName = contactName
    }

    jsDate(): Date {

        if (!this.date)
            return undefined

        return DateHelper.parse(this.date)
    }
}

export class Events {

    constructor(public events: Event[]) { }


    //find(wellnessResourceId, 'start', planning.start) 

    find(type: string, date: number, resourceId?: string): Event {

        const ev = this.events.find(e => e.type == type && e.date == date && (!resourceId || e.resourceId == resourceId))

        return ev
    }


    find2(orderId: string, type: string, date: number, resourceId?: string): Event {

        const ev = this.events.find(e => e.orderId == orderId && e.type == type && e.date == date && (!resourceId || e.resourceId == resourceId))

        return ev
    }

    inRange(range: DateRange): Events {
        return new Events(this.events.filter(e => range.containsDate(e.date)))
    }

}

