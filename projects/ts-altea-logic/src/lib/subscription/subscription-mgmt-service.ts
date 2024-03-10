
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, DateHelper, DbObjectCreate, DbObjectMulti, DbObjectMultiCreate, DbQuery, DbQueryTyped, ObjectHelper, QueryOperator } from 'ts-common'
import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, ResourceAvailability, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, Reminder, OrderLine, Subscription } from 'ts-altea-model'
import { Observable } from 'rxjs'
import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"


export class SubscriptionMgmtService {


    // taskHub: TaskHub
    // this.taskHub = new TaskHub(this.alteaDb)


    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }



    /** Mostly only 1 subscription will be created, except if orderLine.qty > 1 or more subscription products (product item) in product */
    async createSubscriptions(order: Order, orderLine: OrderLine, saveToDb: boolean = true): Promise<Subscription[]> {

        if (!orderLine.product.isSubscription())
            throw `Can't create subscription!`

        let subscriptions : Subscription[] = []

        const prod = orderLine.product


        for (let prodItem of prod.items) {

            for (let i = 0; i < orderLine.qty; i++) {

                const sub = new Subscription()
                sub.orgId = order.orgId
                sub.branchId = order.branchId
                sub.contactId = order.contactId
                sub.orderId = order.id
                sub.name = prod.name

                sub.subscriptionProductId = prod.id
                sub.unitProductId = prodItem.productId
                sub.totalQty = prodItem.qty
                sub.usedQty = 0

                subscriptions.push(sub)
            }
        }



        if (saveToDb) {
            console.warn(subscriptions)

            let res = await this.alteaDb.createSubscriptions(subscriptions)

            console.error(res)

            //subscriptions = res.object

            let subscriptionIds = subscriptions.map(sub => sub.id)

            /** Update order line  */
            if (!orderLine.json)
                orderLine.json = {}

            orderLine.json['subs'] = subscriptionIds

            let orderLineRes = await this.alteaDb.updateOrderline(orderLine, ['json'])

            console.log(orderLineRes)


        }



        return subscriptions
    }


}