/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, ArrayHelper, DateHelper, DbQuery, DbQueryTyped, ObjectHelper, QueryOperator } from 'ts-common'
import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, ResourceAvailability, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MsgInfo, TemplateCode, CustomerCancelReasons } from 'ts-altea-model'
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

    async doAllMessaging(date: Date = new Date()) {

        console.info('Start messaging for ALL orders')

        const orders = await this.alteaDb.getOrdersNeedingCommunication(date)

        if (ArrayHelper.IsEmpty(orders)) {
            console.info('No orders with communication')
            return
        }


        for (let order of orders) {
            const res = this.doMessaging(order)
        }


    }

    async doMessaging(order: Order): Promise<ApiResult<Order>> {

        if (!order)
            return new ApiResult<Order>(order, ApiStatus.error, 'No order supplied!')

        /*
        if (order.deposit > 0 && order.paid < order.deposit)
            return await this.depositMessaging(order)
        */

        switch (order.msgCode) {
            case TemplateCode.resv_wait_deposit:


            case TemplateCode.resv_no_deposit_cancel:
                await this.noDepositCancel(order)


        }

        switch (order.state) {

            case OrderState.waitDeposit:

            case OrderState.waitDeposit:
                console.info(`Deposit messaging for ${order.code}`)
                return await this.depositMessaging(order)

            case OrderState.cancelled:

                switch (order.cancel?.reason) {
                    case CustomerCancelReasons.noDeposit:
                        console.info(`No deposit cancel messaging for ${order.code}`)
                        return await this.depositMessaging(order)
                }

                break

            case OrderState.confirmed:
                console.info(`Reminder messaging for ${order.code}`)
                return await this.reminderMessaging(order)

            default:
                console.info(`No messaging necessary ${order.code}`)

        }

        // from here: deposit is OK => work on reminders, etc...


        const now = new Date()

        if (order.startDate > now)
            return await this.reminderMessaging(order)


        return new ApiResult<Order>(order, ApiStatus.ok)
    }

    async confirmationMessaging(order: Order): Promise<ApiResult<Order>> {

        /*
        if (order.deposit == 0 || order.paid >= order.deposit)
            return new ApiResult<Order>(order, ApiStatus.error, 'No deposit needed or deposit already paid!')

        order.contact.selectMsgType
*/


        return new ApiResult<Order>(order, ApiStatus.ok)
    }

    async noDepositCancel(order: Order): Promise<ApiResult<Order>> {

        try {
            const sendRes = await this.sendMessages(TemplateCode.resv_no_deposit_cancel, order, order.branch, true)

            order.clearMsgCode()

            const updateRes = await this.alteaDb.saveOrder(order)

            return new ApiResult<Order>(order, ApiStatus.ok)
        } catch (error) {

            console.error(error)
            return new ApiResult<Order>(order, ApiStatus.error, `Error sending noDepositCancel messaging`)

        }

    }


    async depositMessaging(order: Order, isFirstDepositMessage = false): Promise<ApiResult<Order>> {

        if (order.deposit == 0 || order.paid >= order.deposit)
            return new ApiResult<Order>(order, ApiStatus.error, 'No deposit needed or deposit already paid!')

        const branch = await this.alteaDb.getBranch(order.branchId)

        console.error(branch)


        let templateCode = TemplateCode.resv_remind_deposit

        if (isFirstDepositMessage)
            templateCode = TemplateCode.resv_wait_deposit

        const sendRes = await this.sendMessages(templateCode, order, branch, true)

        this.setNextDepositReminder(order)

        await this.alteaDb.saveOrder(order)

        return new ApiResult<Order>(order, ApiStatus.ok)
    }



    /**
     * we want to send a new reminder in half the time from now till the deadline of the reminder
     * @param order 
     */
    setNextDepositReminder(order: Order) {

        var currentMsgOn = order.msgOnDate() ?? new Date()
        var depositBy = order.depositByDate()

        const minutesDiff = dateFns.differenceInMinutes(depositBy, currentMsgOn)
        const nextMsgInMinutes = Math.round(minutesDiff / 2)

        if (nextMsgInMinutes > 59) {

            const nextMsgOn = dateFns.addMinutes(currentMsgOn, nextMsgInMinutes)
            order.msgCode = TemplateCode.resv_remind_deposit
            order.msgOn = DateHelper.yyyyMMddhhmmss(nextMsgOn)
            order.m.setDirty('msgCode', 'msgOn')
        }


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
            order.msgCode = TemplateCode.resv_reminder
            order.m.setDirty('msgOn', 'msgCode')

        }

        /** now check if we need to send a reminder */

        let remindersToSent = reminders.filter(r => r.date < now)

        if (!ArrayHelper.AtLeastOneItem(remindersToSent))
            return new ApiResult<Order>(order, ApiStatus.ok, 'No reminders to sent!')

        const alreadySent = await this.alteaDb.getMessages(order.branchId, order.id, TemplateCode.resv_reminder)

        remindersToSent = this.messagesToSent(remindersToSent, alreadySent, TemplateCode.resv_reminder)

        const remindersToSentExist = ArrayHelper.AtLeastOneItem(remindersToSent)

        if (!remindersToSentExist) {


            return new ApiResult<Order>(order, ApiStatus.ok, 'No reminders to sent! (all messages already sent)')
        }




        let reminderTemplates = await this.alteaDb.getTemplates(order.branchId, TemplateCode.resv_reminder)


        this.sendMessagesForMsgInfos(remindersToSent, TemplateCode.resv_reminder, reminderTemplates, order, branch)


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



    messagesToSent(messages: MsgInfo[], alreadySent: Message[], code: TemplateCode): MsgInfo[] {

        let relevantMessages = messages.filter(m => m.code == code)
        let types = relevantMessages.map(m => m.type)
        types = _.uniq(types)

        const toSend: MsgInfo[] = []

        // type can be email, sms, wa (WhatsApp)
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

    lastSentDate(alreadySent: Message[], type: string, code: string): Date {
        let alreadySentForType = alreadySent.filter(m => m.code == code && m.type == type)
        let lastSentOn = new Date(1900, 0, 1)

        if (ArrayHelper.AtLeastOneItem(alreadySentForType)) {
            alreadySentForType = _.orderBy(alreadySentForType, 'sent', 'desc')
            lastSentOn = alreadySentForType[0].sentDate()
        }

        return lastSentOn

    }

    async sendMessagesForMsgInfos(toSend: MsgInfo[], code: TemplateCode, templates: Template[], order: Order, branch: Branch) {

        for (let msg of toSend) {

            const template = templates.find(t => t.channels.indexOf(msg.type) >= 0 && t.code == code)

            if (template)
                await this.sendMessage(msg.type, template, order, branch)


        }

    }




}

