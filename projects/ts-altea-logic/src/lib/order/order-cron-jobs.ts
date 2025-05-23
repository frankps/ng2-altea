
import { Subscription, Order, Gift, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MsgInfo, ConfirmOrderResponse, PaymentType, Payment, OrderType, OrderLine, GiftType, OrderCancel, OrderCancelBy, InternalCancelReasons, MessageAddress, MessageDirection, TemplateFormat } from 'ts-altea-model'
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
        msg.addTo('hilde@aquasense.be', 'Hilde')
        msg.type = MsgType.email
        msg.auto = true
        msg.dir = MessageDirection.out
        msg.fmt = TemplateFormat.html

        await this.alteaDb.db.sendMessage$(msg)

    }

    async doOrderCleanup(orders: Order[], html: HtmlTable, cleanup: { orderCount: number, ids: string[], orders: Order[] }) {

        if (ArrayHelper.IsEmpty(orders))
            return

        let me = this

        try {


            cleanup.orderCount += orders.length

            let ordersToUpdate = []
            const canceledOrderIds = []

            for (let order of orders) {

                const cols = []

                let cancelOrder = true

                /** Should not happen: order has processed gift payments! */
                let processedGiftPay = null

                order.makePayTotals()

                if (order.paid > 0) {

                    if (order.hasOnlyPaymentType(PaymentType.gift)) {

                        let processedGiftPays = order.payments.filter(p => p.type == PaymentType.gift && p.proc)
    
                        if (ArrayHelper.HasItems(processedGiftPays)) {
                            processedGiftPay = processedGiftPays[0]
                            cancelOrder = false

                        }
                    } else {
                        // there is some othe payment on this order => no cancel
                        cancelOrder = false
                    }
                }


                let previousState = order.state


                cols.push(`<a href="https://pos.birdy.life/aqua/orders/manage/${order.id}">${order.id}</a>`)

                if (cancelOrder) {
                    ordersToUpdate.push(order)
                    canceledOrderIds.push(order.id)
                    order.cancel = new OrderCancel()
                    order.state = OrderState.cancelled
                    order.cancel.by = OrderCancelBy.int
                    order.cancel.reason = InternalCancelReasons.clean
                }


                cols.push(order.src)

                cols.push(order.for)

                cols.push(order.startDateFormat())

                cols.push(order.paid)

                cols.push(previousState)
                cols.push(order.state)

                if (processedGiftPay)
                    cols.push(`Order has processed gift pays => no cancel! ${processedGiftPay.amount} ${processedGiftPay.info}`)

                html.addRow(cols)
            }

            cleanup.ids.push(...canceledOrderIds)
            cleanup.orders.push(...ordersToUpdate)
            /*
            if (ArrayHelper.HasItems(canceledOrderIds)) {
                const deletePlanningsRes = await me.alteaDb.deletePlanningsForOrders(canceledOrderIds)
                html.addRow(['Delete plannings'])

                const updateOrdersRes = await me.alteaDb.updateOrders(ordersToUpdate, ['state', 'cancel'])

                html.addRow([`Cancel orders: ${updateOrdersRes.isOk}`])
            }
                */

        } catch (error) {

            html.addRow(['Error', '' + error])

        }
    }

    async cleanupOrders() {

        let me = this

        let msg = new Message()
        msg.subj = 'Cleanup Orders'
        //let orderCount = 0

        let cleanup = { orderCount: 0, ids: [], orders: [] }

        let html = new HtmlTable()
        try {

            let posOrders = await me.alteaDb.getPosOrdersToCleanup()
            await this.doOrderCleanup(posOrders, html, cleanup)


            let appOrders = await me.alteaDb.getAppOrdersToCleanup()
            await this.doOrderCleanup(appOrders, html, cleanup)

            let allOrders = [...posOrders, ...appOrders]

            if (ArrayHelper.IsEmpty(allOrders)) {
                html.addRow(['<h3>Geen orders om te cleanen!</h3>'])
                return 'No orders to clean up!'
            }
            else {
                const header = []
                header.push('Order Id')
                header.push('Gemaakt op')
                header.push('Klant')
                header.push('Datum')
                header.push('Betaald')
                header.push('Vorige status')
                header.push('Nieuwe status')
                html.addRow(header)
            }

            msg.subj = `Cleanup Orders: ${cleanup.orderCount}`

            if (ArrayHelper.HasItems(cleanup.ids)) {
                const deletePlanningsRes = await me.alteaDb.deletePlanningsForOrders(cleanup.ids)

                html.addRow(['Delete plannings'])

                const updateOrdersRes = await me.alteaDb.updateOrders(cleanup.orders, ['state', 'cancel'])

                html.addRow([`Cancel orders: ${updateOrdersRes.isOk}`])
            }

        } catch (error) {

            html.addRow(['Error', '' + error])

        } finally {

            msg.body = html.toHtmlString()

            if (cleanup.orderCount > 0)
                await me.sendMessage(msg)

            return msg.body
        }






    }




}