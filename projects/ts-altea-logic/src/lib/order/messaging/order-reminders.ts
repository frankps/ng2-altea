/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, DateHelper, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, ResourceAvailability, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, Reminder } from 'ts-altea-model'
import { Observable } from 'rxjs'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"
import { AlteaDb } from '../../general/altea-db'
import { IDb } from '../../interfaces/i-db'
import { OrderMessaging } from './order-messaging'


export class OrderReminders {


    alteaDb: AlteaDb
    orderMessaging: OrderMessaging

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)

        this.orderMessaging = new OrderMessaging(this.alteaDb)
    }


    doReminders(order: Order, branch: Branch, reminderTemplates: Template[]) {

        if (!order.start || !Array.isArray(branch.reminders) || branch.reminders.length == 0) {

            if (order.remindOn) {
                order.remindOn = null
                order.m.setDirty('remindOn')
            }
        }

        // all reminders are calculated back from the start date
        const startDate = order.startDate

        const now = new Date()

        let reminders = branch.reminders.map(reminderConfig => reminderConfig.toReminder(startDate))
        reminders = _.orderBy(reminders, 'date')

        let remindersToSent = reminders.filter(r => r.date < now)

        // filter out reminders not yet sent
        remindersToSent = this.remindersNotYetSent(remindersToSent, order.remindLog)

        if (remindersToSent.length > 0) {

            if (!order.remindLog)
                order.remindLog = []

            for (let reminder of remindersToSent) {

                // get template
                const template = reminderTemplates.find(t => t.channels.indexOf(reminder.type) >= 0)

                if (template)
                    this.orderMessaging.createMessage(reminder.type, template, order, branch)


                order.remindLog.push(reminder)
            }

            order.m.setDirty('remindLog')
        }


        // set next remindOn date
        const nextReminder = reminders.find(r => r.date > now)

        if (nextReminder) {
            const remindOn = DateHelper.yyyyMMddhhmmss(nextReminder.date)

            if (remindOn != order.remindOn) {
                order.remindOn = remindOn
                order.m.setDirty('remindOn')
            }

        }

        // save the order

        this.alteaDb.saveOrder(order)
    }

    remindersNotYetSent(reminders: Reminder[], alreadySent: Reminder[]): Reminder[] {

        if (!Array.isArray(reminders) || reminders.length == 0)
            return []

        if (!Array.isArray(alreadySent) || alreadySent.length == 0)
            return reminders

        const notYetSent = reminders.filter(r => alreadySent.findIndex(already => already.on == r.on && already.type == r.type) == -1)

        return notYetSent
    }

}