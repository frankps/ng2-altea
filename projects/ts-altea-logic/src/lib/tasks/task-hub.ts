import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, ResourceAvailability, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, OrderTemplate, Branch } from 'ts-altea-model'
import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import { OrderMessaging } from '../order/messaging/order-messaging'


export class TaskHub {

    alteaDb: AlteaDb
    private messagingTasks: OrderMessaging

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    get MessagingTasks(): OrderMessaging {

        if (!this.messagingTasks)
            this.messagingTasks = new OrderMessaging(this.alteaDb)

        return this.messagingTasks
    }

}