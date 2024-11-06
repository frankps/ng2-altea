import { ObjectHelper } from "ts-common"
import { Exclude, Type, Transform } from "class-transformer";

/*
{
    id: ObjectHelper.newGuid(),
    event: event,
    date: new Date()
}
    */

export class StripeEventContainer {
    id: string

    date: Date = new Date()
    event: any
    src: string
    orderId: string

    constructor(event: any) {
        this.id = ObjectHelper.newGuid()
        this.event = event
    }
}



// 'a2e6fd59-b1be-47ce-8c71-8d41eb02a733'
