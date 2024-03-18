/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, DateHelper, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, ResourceAvailability, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, OrderTemplate, Branch } from 'ts-altea-model'
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



    async cancelExpiredDeposists() {

        const orders = await this.alteaDb.getExpiredDepositOrders()

        console.warn(orders)

        const branchIds = _.uniqBy(orders, 'branchId').map(o => o.branchId)

        const templates = await this.alteaDb.getTemplatesForBranches(branchIds, OrderTemplate.noDepositCancel)
        const branches = await this.alteaDb.getBranches(branchIds)

        for (let branch of branches) {

            const branchOrders = orders.filter(o => o.branchId == branch.id)
            const branchTemplates = templates.filter(t => t.branchId == branch.id)

            if (!Array.isArray(branchTemplates) || branchTemplates.length == 0)
                continue

            for (let order of branchOrders) {


                for (let template of branchTemplates) {

                    const msg = await this.taskHub.MessagingTasks.createEmailMessage(template, order, branch, true)

                    console.warn(msg)

                }



                order.state = OrderState.noDepositCancel
                order.m.setDirty('state')
        
                this.alteaDb.saveOrder(order)

            }


        }


    }


}
