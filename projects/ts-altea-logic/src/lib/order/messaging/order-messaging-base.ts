import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MessageAddress, TemplateCode, Contact } from 'ts-altea-model'
import { AlteaDb } from '../../general/altea-db'
import { IDb } from '../../interfaces/i-db'
import { ApiListResult, ApiResult, ApiStatus, ArrayHelper } from 'ts-common'


export class OrderMessagingBase {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    /** call this method when sms is not supported */
    removeSms(types: MsgType[]): MsgType[] {

        if (ArrayHelper.IsEmpty(types))
            return []

        let smsIdx = types.indexOf(MsgType.sms)

        if (smsIdx >= 0)
            types.splice(smsIdx, 1)

        return types

    }

    async sendMessages(templateCode: TemplateCode | string, order: Order, branch: Branch, send: boolean = true, ...types: MsgType[]): Promise<ApiListResult<Message>> {

        if (!order.msg) // messaging disabled for order
            return ApiListResult.warning(`Messaging disabled for order ${order.id}`)

        var fullResult = new ApiListResult<Message>()

        // SMS not supported yet!
        this.removeSms(types)

        /** if types (email, sms, wa=WhatsApp) are not specified explicitly, then we use preferred contact message types */
        if (ArrayHelper.IsEmpty(types)) {

            types = order.contact.msg

            // SMS not supported yet!
            this.removeSms(types)

        }

        if (ArrayHelper.IsEmpty(types)) {

            console.warn(`Contact has no preffered types specified: fall-back to email`)
            types = [MsgType.email]
        }

        // this can return different templates for email, sms, whatsapp
        let templates = await this.alteaDb.getTemplates(order.branchId, templateCode)

        for (let type of types) {

            let template = templates.find(tpl => tpl.channels.indexOf(type) >= 0)

            if (!template)
                template = templates.find(tpl => tpl.channels.indexOf(MsgType.email) >= 0)

            if (!template) {
                console.error(`No template found ${templateCode} and channel/type ${type}`)
            }


            var sendResult = await this.sendTemplate(type, template, order, branch, send)

            if (!sendResult.isOk)
                fullResult.status = sendResult.status

            if (sendResult.object)
                fullResult.data.push(sendResult.object)
        }

        return fullResult



        /**
         * Some message types work with internal templates (from DB): email, sms
         * other message types (whatsapp) work with templates configured in those systems => no need to lookup template
         

        const typesInternalTemplates = types.filter(type => type != MsgType.wa)

        if (ArrayHelper.NotEmpty(typesInternalTemplates)) {


        }

        */
    }


    /**
     * Send all given templates to the given contact, for all allowed message types for that contact (channels, ex. email, whatsapp, ...)
     * Returns a list of messages that were sent
     * 
     * @param templates 
     * @param contact 
     * @param order 
     * @param branch 
     * @param send 
     * @returns 
     */
    async sendPossibleTemplates(templates: Template[], contact: Contact, order: Order, branch: Branch, send: boolean = true): Promise<ApiResult<Message>[]> {

        let result: ApiResult<Message>[] = []

        for (let template of templates) {

            let channels = template.msgTypes()

            for (let channel of channels) {

                if (!contact.msgTypeSelected(channel))
                    continue

                let res = await this.sendTemplate(channel, template, order, branch, send)

                result.push(res)

            }
        }

        return result
    }


    async sendTemplate(type: MsgType, template: Template, order: Order, branch: Branch, send: boolean = true): Promise<ApiResult<Message>> {

        if (!order.msg) // messaging disabled for order
            return ApiResult.warning('Messaging disabled for order!')

        switch (type) {

            case MsgType.email:
                return await this.sendEmailTemplate(template, order, branch, send)
            case MsgType.sms:
                return await this.sendSmsTemplate(template, order, branch, send)
            case MsgType.wa:
                return await this.sendWhatsAppTemplate(template, order, branch, send)
            default:
                throw `Message type ${type} not supported!`
        }
    }

    async sendMessage(msg: Message, order: Order, contact: Contact, branch: Branch, send: boolean = true): Promise<ApiResult<Message>> {

        if (!order.msg) // messaging disabled for order
            return ApiResult.warning('Messaging disabled for order!')


        if (!msg.conIds)
            msg.conIds = []

        if (msg.conIds.indexOf(contact.id) < 0)
            msg.conIds.push(contact.id)


        switch (msg.type) {

            case MsgType.wa:

                if (!contact.mobile)
                    return ApiResult.error(`Can't send Whatsapp: contact has no mobile number`)

                msg.addTo(contact.mobile, contact.name, contact.id)  // contact.email
                break

            case MsgType.email:

                if (!contact.email)
                    return ApiResult.error(`Can't send email: contact has no email address`)

                msg.from = new MessageAddress(branch.emailFrom, branch.name)

                msg.addTo(contact?.email, contact.name, contact.id)

                if (branch.emailBcc)
                    msg.addBcc(branch.emailBcc)
        }

        // msg.type = MsgType.wa
        msg.orderId = order?.id

        if (send) {

            const sendRes = await this.alteaDb.db.sendMessage$(msg)
            //const sendRes = new ApiResult(msg)
            console.warn(sendRes)

        }

        return new ApiResult(msg)

    }

    async sendWhatsAppTemplate(template: Template, order: Order, branch: Branch, send: boolean = true): Promise<ApiResult<Message>> {

        if (!order.msg) // messaging disabled for order
            return ApiResult.warning('Messaging disabled for order!')

        const contact = order.contact

        if (!contact?.mobile)
            return ApiResult.error(`Can't send Whatsapp: contact has no mobile number`)

        const msg = template.mergeWithOrder(order, branch, true)

        // return new ApiResult(msg)

        console.warn(msg)

        if (!msg.conIds)
            msg.conIds = []

        msg.conIds.push(contact.id)


        msg.addTo(contact.mobile, contact.name, contact.id)  // contact.email

        msg.type = MsgType.wa
        msg.orderId = order?.id

        if (send) {

            const sendRes = await this.alteaDb.db.sendMessage$(msg)
            //const sendRes = new ApiResult(msg)
            console.warn(sendRes)

        }

        return new ApiResult(msg)
    }

    async sendEmailTemplate(template: Template, order: Order, branch: Branch, send: boolean = true): Promise<ApiResult<Message>> {

        if (!order.msg) // messaging disabled for order
            return ApiResult.warning('Messaging disabled for order!')

        if (!branch.emailFrom)
            return ApiResult.error(`Branch 'emailFrom' missing`)

        const contact = order.contact

        if (!contact?.email)
            return ApiResult.error(`Can't send email: contact has no email address`)

        const msg = template.mergeWithOrder(order, branch)

        msg.from = new MessageAddress(branch.emailFrom, branch.name)

        msg.addTo(contact?.email, contact.name, contact.id)

        if (branch.emailBcc)
            msg.addBcc(branch.emailBcc)

        //msg.to.push(order.contact.email)
        //msg.addTo('frank@dvit.eu', 'Frank Paepens')

        if (!msg.conIds)
            msg.conIds = []

        msg.conIds.push(contact.id)

        msg.type = MsgType.email
        msg.orderId = order?.id

        if (send) {

            const sendRes = await this.alteaDb.db.sendMessage$(msg)
            console.warn(sendRes)
        }

        return new ApiResult(msg)
    }

    async sendSmsTemplate(template: Template, order: Order, branch: Branch, send: boolean = true): Promise<ApiResult<Message>> {

        if (!order.msg) // messaging disabled for order
            return ApiResult.warning('Messaging disabled for order!')

        const contact = order.contact

        if (!contact?.mobile)
            return ApiResult.error(`Can't send Whatsapp: contact has no mobile number`)

        const msg = template.mergeWithOrder(order, branch)

        msg.addTo(order.contact.mobile, order.contact.getName(), order.contact.id)
        msg.type = MsgType.sms
        msg.orderId = order?.id

        if (send) {

            const sendRes = await this.alteaDb.db.sendMessage$(msg)
            console.warn(sendRes)
            return sendRes
        }

        return new ApiResult(msg)
    }
}