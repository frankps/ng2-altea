import { ArrayHelper, DateHelper, ObjectHelper } from "ts-common"
import { Job } from "./job"
import { Type } from "class-transformer"
import { th } from "date-fns/locale"

export enum EventType {
    wellness_start = 'wellness_start',
    wellness_end = 'wellness_end',
    door_enable = 'door_enable',
    door_disable = 'door_disable',
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

    constructor(type: string, date: number, resourceId?: string, id?: string) {

        if (id)
            this.id = id
        else
            this.id =  ObjectHelper.newGuid()

        this.type = type
        this.date = date
        this.resourceId = resourceId

    }

    jsDate() : Date {

        if (!this.date)
            return undefined

        return DateHelper.parse(this.date)
    }
}

export class Events {

    constructor(public events: Event[]) { }


    //find(wellnessResourceId, 'start', planning.start) 

    find(type: string, date: number, resourceId?: string): Event {

        const ev = this.events.find(e =>  e.type == type && e.date == date && (!resourceId || e.resourceId == resourceId))

        return ev
    }


    find2(orderId: string, type: string, date: number, resourceId?: string): Event {

        const ev = this.events.find(e => e.orderId == orderId && e.type == type && e.date == date && (!resourceId || e.resourceId == resourceId))

        return ev
    }

}

