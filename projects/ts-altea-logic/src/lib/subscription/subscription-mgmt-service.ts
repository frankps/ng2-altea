
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, ArrayHelper, DateHelper, DbObjectCreate, DbObjectMulti, DbObjectMultiCreate, DbQuery, DbQueryTyped, ObjectHelper, QueryOperator } from 'ts-common'
import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MsgInfo, OrderLine, Subscription, Product, PriceChangeType } from 'ts-altea-model'
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

        let prod = orderLine.product

        console.log('Subscriptions')

        if (ArrayHelper.IsEmpty(prod.items))
            prod = await this.alteaDb.getProduct(orderLine.productId, ...Product.defaultInclude)

        // check if there is a price change causing extra subscription qty
        let extraQtyAbs = 0
        let extraQtyPct = 1
        
        if (orderLine.hasPriceChanges()) {
            let qtyChanges = orderLine.pc.filter(pc => pc.tp == PriceChangeType.subsQty)

            if (ArrayHelper.NotEmpty(qtyChanges)) {

                for (let qtyChange of qtyChanges) {

                    if (qtyChange.pct) {
                        extraQtyPct = _.round(extraQtyPct * (1 + qtyChange.val / 100), 2)
                    } else {
                        extraQtyAbs += qtyChange.val
                    }
                }
                
            }
        }


        for (let prodItem of prod.items) {

            let qty = prodItem.qty 

            if (prodItem.optionQty) {
                let option = orderLine.getOptionById(prodItem.optionId)

                if (!option) {
                    let msg = `Option defining subscription quantity not found: ${prodItem.optionId}`
                    console.error(msg)
                }

                if (!option.hasValues()) {
                    let msg = `Option defining subscription quantity has no selected values: ${option.name}`
                    console.error(msg)
                }

                let value = option.values[0]
                qty = _.round(value.val, 0)
            } 
        
            qty = (qty + extraQtyAbs) * extraQtyPct
            qty = _.round(qty,0)
            

            for (let i = 0; i < orderLine.qty; i++) {

                const sub = new Subscription()
                sub.orgId = order.orgId
                sub.branchId = order.branchId
                sub.contactId = order.contactId
                sub.orderId = order.id
                sub.name = prod.name

                sub.subscriptionProductId = prod.id
                sub.unitProductId = prodItem.productId

                let optionIds = prodItem.product?.getOptionIds()

                if (ArrayHelper.NotEmpty(optionIds)) {

                    sub.options = orderLine.getOptions(...optionIds)
                }

                console.log(prodItem)
                

                sub.totalQty = qty


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