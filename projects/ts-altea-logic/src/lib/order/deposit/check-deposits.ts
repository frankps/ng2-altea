/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, DateHelper, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch } from 'ts-altea-model'
import { Observable } from 'rxjs'
import { AlteaDb } from '../../general/altea-db'
import { IDb } from '../../interfaces/i-db'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"
import { OrderMessagingBase } from '../messaging/order-messaging-base'
import { TaskHub } from '../../tasks/task-hub'

export class CheckDeposists {

    alteaDb: AlteaDb
    taskHub: TaskHub
    
    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)


        this.taskHub = new TaskHub(this.alteaDb)
    }






}
