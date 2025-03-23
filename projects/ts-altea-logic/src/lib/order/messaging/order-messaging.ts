/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, ArrayHelper, DateHelper, DbObject, DbQuery, DbQueryTyped, HtmlTable, ObjectHelper, QueryOperator } from 'ts-common'
import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MsgInfo, TemplateCode, CustomerCancelReasons, MessageAddress, MessageDirection, TemplateFormat, Contact } from 'ts-altea-model'
import { Observable } from 'rxjs'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"
import { AlteaDb } from '../../general/altea-db'
import { IDb } from '../../interfaces/i-db'
import { OrderMessagingBase } from './order-messaging-base'
import { logger } from 'handlebars'

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

        if (!order.msg) // messaging disabled for order
            return ApiResult.warning('Messaging disabled for order!')
        /*
        if (order.deposit > 0 && order.paid < order.deposit)
            return await this.depositMessaging(order)
        */

        switch (order.msgCode) {
            case TemplateCode.resv_wait_deposito:
            case TemplateCode.resv_no_deposit_cancel:
                await this.noDepositCancel(order)


        }

        switch (order.state) {

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

        if (!order.msg) // messaging disabled for order
            return ApiResult.warning('Messaging disabled for order!')

        /*
        if (order.deposit == 0 || order.paid >= order.deposit)
            return new ApiResult<Order>(order, ApiStatus.error, 'No deposit needed or deposit already paid!')

        order.contact.selectMsgType
*/

        const branch = await this.alteaDb.getBranch(order.branchId)


        const sendRes = await this.sendMessages(TemplateCode.resv_confirmation, order, branch, true)


        return new ApiResult<Order>(order, ApiStatus.ok)
    }

    async noDepositCancel(order: Order): Promise<ApiResult<Order>> {

        if (!order.msg) // messaging disabled for order
            return ApiResult.warning('Messaging disabled for order!')

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

        if (!order.msg) // messaging disabled for order
            return ApiResult.warning('Messaging disabled for order!')

        if (order.deposit == 0 || order.paid >= order.deposit)
            return new ApiResult<Order>(order, ApiStatus.error, 'No deposit needed or deposit already paid!')

        const branch = await this.alteaDb.getBranch(order.branchId)

        console.error(branch)


        let templateCode = TemplateCode.resv_remind_deposit

        if (isFirstDepositMessage)
            templateCode = TemplateCode.resv_wait_deposito

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
        var depoBy = order.depoByDate()

        const minutesDiff = dateFns.differenceInMinutes(depoBy, currentMsgOn)
        const nextMsgInMinutes = Math.round(minutesDiff / 2)

        if (nextMsgInMinutes > 59) {

            const nextMsgOn = dateFns.addMinutes(currentMsgOn, nextMsgInMinutes)
            order.msgCode = TemplateCode.resv_remind_deposit
            order.msgOn = DateHelper.yyyyMMddhhmmss(nextMsgOn)
            order.m.setDirty('msgCode', 'msgOn')
        }


    }






    async reminderMessaging(order: Order): Promise<ApiResult<Order>> {

        if (!order.msg) // messaging disabled for order
            return ApiResult.warning('Messaging disabled for order!')


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
                await this.sendTemplate(msg.type, template, order, branch)


        }

    }



    giftMessaging(order: Order) {

        order

    }




    /** Send message to admin about cancelled orders (due to expired deposits) */
    async messageExpiredDepositCancels(branch: Branch, cancelledOrders: Order[], errors: ApiResult<Order>[]): Promise<ApiResult<Message>> {

        const reportBlocks: string[] = []

        if (ArrayHelper.NotEmpty(cancelledOrders)) {

            reportBlocks.push(`<h4>Cancelled orders</h4>`)

            const cancelledTable = new HtmlTable()

            const cols = []

            for (let order of cancelledOrders) {

                cols.push(DateHelper.dateToString_DM_HHmm(order.startDate))
                cols.push(order.for)
                cols.push(order.paid)
                cols.push(order.incl)
            }

            cancelledTable.rows.push(cols)

            reportBlocks.push(cancelledTable.toHtmlString())
        }

        if (ArrayHelper.NotEmpty(errors)) {

            reportBlocks.push(`<h4>Errors</h4>`)

            const errorTable = new HtmlTable()

            const cols = []

            for (let error of errors) {

                let order = error.object

                cols.push(error.error)

                if (order) {
                    cols.push(DateHelper.dateToString_DM_HHmm(order.startDate))
                    cols.push(order.for)
                    cols.push(order.paid)
                    cols.push(order.incl)
                }

            }

            errorTable.rows.push(cols)

            reportBlocks.push(errorTable.toHtmlString())
        }

        const body = reportBlocks.join('\n')

        const msg = Message.adminEmail(branch, 'Cancelled orders: voorschot niet betaald', body)

        const res = await this.alteaDb.db.sendMessage$(msg)

        return res

    }


    // get non active orders: state=creation, older then 15min,
    async sendAdminMessage(subject: string, body: string) {

        const msg = new Message()

        msg.subj = subject
        msg.body = body

        msg.from = new MessageAddress('info@aquasense.be', 'Aquasense')
        msg.addTo('frank.newsly@gmail.com', 'Frank')
        msg.addTo('hilde@aquasense.be', 'Hilde')
        msg.type = MsgType.email
        msg.auto = true
        msg.dir = MessageDirection.out
        msg.fmt = TemplateFormat.html

        await this.alteaDb.db.sendMessage$(msg)
    }



    /**
     * Send door info messages to customers
     * @param dayMin 
     * @returns 
     */
    async doorMessaging(dayMin: number = 1, msgTypes: MsgType[] = [MsgType.wa, MsgType.email]) {   // MsgType.wa , MsgType.email

        const templateCode = TemplateCode.resv_door_info2

        let today = new Date()
        today = dateFns.startOfDay(today)

        let from = dateFns.addDays(today, dayMin)
        let to = dateFns.addDays(from, 1)

        let fromNum = DateHelper.yyyyMMdd000000(from)
        let toNum = DateHelper.yyyyMMdd000000(to)

        let extra = {
            contactId: '8fdbf31f-1c6d-459a-b997-963dcd0740d8',
            branchIds: ['66e77bdb-a5f5-4d3d-99e0-4391bded4c6c']
        }

        const orders = await this.alteaDb.getOrdersStartingBetween(fromNum, toNum, extra)


        let branchIds = orders.map(o => o.branchId)
        branchIds = _.uniq(branchIds)

        const branches = await this.alteaDb.getBranches(branchIds)

        let errorCount = 0
        let reminderCount = 0

        const htmlBody: string[] = []
        try {


            htmlBody.push(`<h2>Door messaging</h2>`)

            htmlBody.push(`<p>Voor boekingen tussen ${dateFns.format(from, 'dd/MM')} en ${dateFns.format(to, 'dd/MM')}</p>`)

            for (let branch of branches) {

                htmlBody.push(`<h4>${branch.name}</h4>`)

                const reminderTable = new HtmlTable()

                //const template = await this.alteaDb.getTemplate(branch.id, templateCode, msgType)

                const templates = await this.alteaDb.getTemplates(branch.id, templateCode)

                if (ArrayHelper.IsEmpty(templates))
                    console.warn(`Branch '${branch.name}'has no templates '${templateCode}'`)


                const templatesByType = new Map<MsgType, Template>()
                const msgTypesToSend : MsgType[] = []

                for (let msgType of msgTypes) {

                    const template = templates.find(t => t.channels.indexOf(msgType) >= 0)

                    if (!template) {
                        console.warn(`Branch '${branch.name}' has no template '${templateCode}' for '${msgType}'`)
                        continue
                    }

                    templatesByType.set(msgType, template)
                    msgTypesToSend.push(msgType)
                }

                // const msgTypesToSend = templatesByType.keys()

                let branchOrders = orders.filter(o => o.branchId == branch.id)

                const header = []
                header.push('Klant')
                header.push('Aanvang')
                header.push('Status')
                header.push('Voorschot')
                header.push('Betaald')


                for (let order of branchOrders) {

                    const cols = []
                    reminderTable.addRow(cols)

                    cols.push(order.for)
                    cols.push(DateHelper.dateToString_DM_HHmm(order.startDate))
                    cols.push(order.state)
                    cols.push(order.depo ? order.deposit : '')
                    cols.push(order.paid)
                    cols.push(order.sumToString(false))


                    if (!order.contact) {
                        cols.push('No contact')
                        continue
                    }

                    let contact = order.contact

                    if (!contact.entry) {

                        contact.entry = ObjectHelper.createRandomNumberString(4)
                        let contactId = contact.id
                        let dbObj = new DbObject<Contact>('contact', Contact, { id: contactId, entry: contact.entry })

                        const updatedResult = await this.alteaDb.db.update$<Contact>(dbObj)

                        if (updatedResult.status != ApiStatus.ok) {
                            let msg = `Could not set entry code '${contact.entry}' for contact ${contact.name}`
                            cols.push(msg)
                            continue
                        }

                        contact = updatedResult.object

                        console.log(updatedResult)
                    }


                    for (let msgType of msgTypesToSend) {

                        let template = templatesByType.get(msgType)

                        try {

                            let replacements = {
                                'door-code': contact.entry,
                                'relative-date-time': order.relativeStartDate()
                            }

                            let message = template.merge(branch, replacements, order.id, true)
                            message.type = msgType

                            let res = await this.sendMessage(message, order, contact, branch, true)

                            if (!res.isOk) {
                                errorCount++

                                cols.push(`Problem: ${res.message}`)
                            } else {
                                cols.push('OK')
                                reminderCount++
                            }

                        } catch (error) {

                            cols.push(`exception: ${error}`)
                        }

                    }

                    const newTag = order.addTag(templateCode)

                    if (newTag) {
                        let orderUpdate = new DbObject<Order>('order', Order, { id: order.id, tags: order.tags })
                        const updatedResult = await this.alteaDb.db.update$<Order>(orderUpdate)

                        console.log(orderUpdate, updatedResult)
                    }

                }

                htmlBody.push(reminderTable.toHtmlString())

            }




        } catch (err) {

            htmlBody.push(err)
            errorCount++

        } finally {

            let html = htmlBody.join('<br>\n')

            let errorMsg = 'OK'
            if (errorCount > 0)
                errorMsg = `! Problems=${errorCount} !`

            let subject = `Door entry codes day-${dayMin} ${msgTypes}: ${reminderCount} (${errorMsg})`

            await this.sendAdminMessage(subject, html)

            return `<h1>${subject}</h1><br><br>${html}`

        }




    }



    async reminderMessaging2(dayMin: number = 2, msgType: MsgType = MsgType.email): Promise<string> {



        const templateCode = TemplateCode.resv_reminder

        let reminderCount = 0

        let today = new Date()
        today = dateFns.startOfDay(today)

        let from = dateFns.addDays(today, dayMin)
        let to = dateFns.addDays(from, 1)

        let fromNum = DateHelper.yyyyMMdd000000(from)
        let toNum = DateHelper.yyyyMMdd000000(to)

        const orders = await this.alteaDb.getOrdersStartingBetween(fromNum, toNum)
        /*let demoOrder = await this.alteaDb.getOrder('aac87736-7e46-440d-9e13-faad00faf1e0', 'contact')
        const orders = [demoOrder]
*/
        let branchIds = orders.map(o => o.branchId)
        branchIds = _.uniq(branchIds)

        const branches = await this.alteaDb.getBranches(branchIds)

        let errorCount = 0

        const htmlBody: string[] = []
        try {


            htmlBody.push(`<h2>Reminder messaging</h2>`)

            htmlBody.push(`<p>Voor boekingen tussen ${dateFns.format(from, 'dd/MM')} en ${dateFns.format(to, 'dd/MM')}</p>`)

            for (let branch of branches) {

                htmlBody.push(`<h4>${branch.name}</h4>`)


                const reminderTable = new HtmlTable()


                const template = await this.alteaDb.getTemplate(branch.id, templateCode, msgType)

                if (!template)
                    console.warn(`Branch '${branch.name}'has no template '${templateCode}' for '${msgType}'`)

                let branchOrders = orders.filter(o => o.branchId == branch.id)

                const header = []
                header.push('Klant')
                header.push('Aanvang')
                header.push('Status')
                header.push('Voorschot')
                header.push('Betaald')


                for (let order of branchOrders) {

                    const cols = []
                    reminderTable.addRow(cols)

                    cols.push(order.for)
                    cols.push(DateHelper.dateToString_DM_HHmm(order.startDate))
                    cols.push(order.state)
                    cols.push(order.depo ? order.deposit : '')
                    cols.push(order.paid)
                    cols.push(order.sumToString(false))

                    try {
                        let res = await this.sendEmailTemplate(template, order, branch, true)

                        if (!res.isOk) {
                            errorCount++

                            cols.push(`Problem: ${res.message}`)
                        } else {
                            cols.push('OK')
                            reminderCount++
                        }

                    } catch (error) {

                        cols.push(`exception: ${error}`)
                    }



                }

                htmlBody.push(reminderTable.toHtmlString())

            }




        } catch (err) {

            htmlBody.push(err)
            errorCount++

        } finally {

            let html = htmlBody.join('<br>\n')

            let errorMsg = 'OK'
            if (errorCount > 0)
                errorMsg = `! Problems=${errorCount} !`

            let subject = `Reminders day-${dayMin} ${msgType}: ${reminderCount} (${errorMsg})`

            await this.sendAdminMessage(subject, html)

            return `<h1>${subject}</h1><br><br>${html}`

        }











    }




}

