/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, ArrayHelper, DateHelper, DbQuery, DbQueryTyped, ObjectHelper, QueryOperator } from 'ts-common'
import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, ResourceAvailability, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MsgInfo } from 'ts-altea-model'
import { Observable } from 'rxjs'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"
import { AlteaDb } from '../../general/altea-db'
import { IDb } from '../../interfaces/i-db'
import { OrderMessagingBase } from './order-messaging-base'

/**
 * Mogelijkheden:
 
Door klant gemaakt order:
 * reeds betaald => stuur confirmatie
  
Intern gemaakt:
 * reeds betaald (deposit>=paid, bv met gift) of geen betaling nodig (deposit=0)
    => stuur confirmatie
 * nog niet betaald:
 * 
 
Different kinds of messages:

* deposit related (depost>0 AND deposit<=paid) 
    send reminders to make deposit

* confirmation:
    when no deposit needed
    or when deposit was done (paid>=deposit)  

* reminders:
    send reminders for reservation

* cancellation

 */

export class OrderMessaging extends OrderMessagingBase {


    constructor(db: IDb | AlteaDb) {
        super(db)
    }

    async doMessaging(order: Order): Promise<ApiResult<Order>> {

        if (!order)
            return new ApiResult<Order>(order, ApiStatus.error, 'No order supplied!')

        if (order.deposit > 0 && order.paid < order.deposit)
            return await this.depositMessaging(order)

        // from here: deposit is OK => work on reminders, etc...


        const now = new Date()

        if (order.startDate > now)
            return await this.reminderMessaging(order)


        return new ApiResult<Order>(order, ApiStatus.ok)
    }

    async confirmationMessaging(order: Order): Promise<ApiResult<Order>> {

        if (order.deposit == 0 || order.paid >= order.deposit)
            return new ApiResult<Order>(order, ApiStatus.error, 'No deposit needed or deposit already paid!')

        return new ApiResult<Order>(order, ApiStatus.ok)
    }

    async depositMessaging(order: Order): Promise<ApiResult<Order>> {

        if (order.deposit == 0 || order.paid >= order.deposit)
            return new ApiResult<Order>(order, ApiStatus.error, 'No deposit needed or deposit already paid!')

        


        return new ApiResult<Order>(order, ApiStatus.ok)
    }

    async reminderMessaging(order: Order): Promise<ApiResult<Order>> {

        const now = new Date()
        const startDate = order.startDate

        if (!startDate)
            return new ApiResult<Order>(order, ApiStatus.error, 'Order has no startdate!')

        if (startDate < now)
            return new ApiResult<Order>(order, ApiStatus.error, 'No reminders for past order!')

        const branch = await this.alteaDb.getBranch(order.branchId)


        let reminders: MsgInfo[] = branch.reminders.map(reminderConfig => reminderConfig.toMsgInfo(startDate))
        reminders = _.orderBy(reminders, 'date')

        /** first configure the next reminder (order.msgOn)  */

        const futureReminders = reminders.filter(r => r.date > now)
        const futureRemindersExist = ArrayHelper.AtLeastOneItem(futureReminders)

        if (futureRemindersExist) {

            const nextReminder = futureReminders[0]

            order.msgOn = DateHelper.yyyyMMddhhmmss(nextReminder.date)
            order.msgCode = 'reminder'
            order.m.setDirty('msgOn', 'msgCode')
            
        }

        /** now check if we need to send a reminder */

        let remindersToSent = reminders.filter(r => r.date < now)

        if (!ArrayHelper.AtLeastOneItem(remindersToSent))
            return new ApiResult<Order>(order, ApiStatus.ok, 'No reminders to sent!')

        const alreadySent = await this.alteaDb.getMessages(order.branchId, order.id, 'reminder')

        remindersToSent = this.messagesToSent(remindersToSent, alreadySent, 'reminder')

        const remindersToSentExist = ArrayHelper.AtLeastOneItem(remindersToSent)

        if (!remindersToSentExist) {


            return new ApiResult<Order>(order, ApiStatus.ok, 'No reminders to sent! (all messages already sent)')
        }




        let reminderTemplates = await this.alteaDb.getTemplates(order.branchId, 'reminder')


        this.sendMessages(remindersToSent, 'reminder', reminderTemplates, order, branch)


        // if (reminderTemplates)

        /*
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
        */

        return new ApiResult<Order>(order, ApiStatus.ok)
    }



    messagesToSent(messages: MsgInfo[], alreadySent: Message[], code: string): MsgInfo[] {

        let relevantMessages = messages.filter(m => m.code == code)
        let types = relevantMessages.map(m => m.type)
        types = _.uniq(types)

        const toSend: MsgInfo[] = []

        // type can be email, sms, ...
        for (let type of types) {

            let lastSentOn = this.lastSentDate(alreadySent, type, code)


            let toSendForType = relevantMessages.filter(m => m.type == type && m.date > lastSentOn)


            if (ArrayHelper.AtLeastOneItem(toSendForType)) {
                const ordered = _.orderBy(toSendForType, 'date', 'desc')
                toSend.push(ordered[0])
            }


        }

       // messages.filter(m => alreadySent.findIndex(already => already.on == r.on && already.type == r.type) == -1)

        return toSend

    }

    lastSentDate(alreadySent: Message[], type: string, code: string) : Date {
        let alreadySentForType = alreadySent.filter(m => m.code == code && m.type == type)
        let lastSentOn = new Date(1900,0,1)

       if (ArrayHelper.AtLeastOneItem(alreadySentForType)) {
          alreadySentForType = _.orderBy(alreadySentForType, 'sent', 'desc')
          lastSentOn = alreadySentForType[0].sentDate()
       }

       return lastSentOn

    }

    async sendMessages(toSend: MsgInfo[], code: string, templates: Template[], order: Order, branch: Branch) {

        for (let msg of toSend) {

            const template = templates.find(t => t.channels.indexOf(msg.type) >= 0 && t.code == code)

            if (template)
                await this.createMessage(msg.type, template, order, branch)


        }

    }




}