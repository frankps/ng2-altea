import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch } from 'ts-altea-model'
import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import { OrderMessagingBase } from '../order/messaging/order-messaging-base'


export class TaskHub {

    alteaDb: AlteaDb
    private messagingTasks: OrderMessagingBase

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    get MessagingTasks(): OrderMessagingBase {

        if (!this.messagingTasks)
            this.messagingTasks = new OrderMessagingBase(this.alteaDb)

        return this.messagingTasks
    }

}