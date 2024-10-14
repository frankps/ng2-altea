
import { Subscription, Order, Gift, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, ResourceAvailability, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MsgInfo, ConfirmOrderResponse, PaymentType, Payment, OrderType, OrderLine, GiftType, OrderCancel, OrderCancelBy, InternalCancelReasons, MessageAddress, MessageDirection } from 'ts-altea-model'
import { Observable } from 'rxjs'
import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import { CreateResourceRequest } from './reservation/create-resource-request'
import { CreateAvailabilityContext } from './reservation/create-availability-context'
import { SlotFinder } from './reservation/slot-finder'
import { ResourceRequestOptimizer } from './reservation/resource-request-optimizer'
import { SolutionPicker } from './reservation/solution-picker'
import { DetermineReservationOptions } from './reservation/determine-reservation-options'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"
import { ArrayHelper, HtmlTable } from 'ts-common'





export class OrderCronJobs {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    // get non active orders: state=creation, older then 15min,
    async sendMessage(msg: Message) {

        msg.from = new MessageAddress('info@aquasense.be', 'Aquasense')
        msg.addTo('frank.newsly@gmail.com', 'Frank')
        msg.type = MsgType.email
        msg.auto = true
        msg.dir = MessageDirection.int

        await this.alteaDb.db.sendMessage$(msg)

    }


    async cleanupOrders() {

        let me = this

        let msg = new Message()
        msg.subj = 'Cleanup Orders'
        let orderCount = 0


        let html = new HtmlTable()
        try {

            let posOrders = await me.alteaDb.getPosOrdersToCleanup()
            let appOrders = await me.alteaDb.getAppOrdersToCleanup()

            if (ArrayHelper.IsEmpty(posOrders)) {
                return 'No orders to clean up!'
            }

            let allOrders = [...posOrders, ...appOrders]

            orderCount = posOrders.length

            const orderIds = allOrders.map(o => o.id)

            for (let order of allOrders) {

                const cols = []

                order.state = OrderState.cancelled

                cols.push(order.id)

                order.cancel = new OrderCancel()
                order.cancel.by = OrderCancelBy.int
                order.cancel.reason = InternalCancelReasons.clean
                
                cols.push(order.src)

                cols.push(order.for)

                html.addRow(cols)
            }

            const deletePlanningsRes = await me.alteaDb.deletePlanningsForOrders(orderIds)

            html.addRow(['Delete plannings'])

            const updateOrdersRes = await me.alteaDb.updateOrders(allOrders, ['state', 'cancel'])

            html.addRow(['Cancel orders'])

        } catch (error) {

            html.addRow(['Error', '' + error])

        } finally {

            msg.body = html.toString()

            if (orderCount > 0)
                await me.sendMessage(msg)

            return msg.body
        }






    }




}