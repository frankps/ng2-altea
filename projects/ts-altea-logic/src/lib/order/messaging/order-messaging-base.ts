import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MessageAddress, TemplateCode } from 'ts-altea-model'
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


            var sendResult = await this.sendMessage(type, template, order, branch, send)

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


    async sendMessage(type: MsgType, template: Template, order: Order, branch: Branch, send: boolean = true): Promise<ApiResult<Message>> {

        if (!order.msg) // messaging disabled for order
            return ApiResult.warning('Messaging disabled for order!')

        switch (type) {

            case MsgType.email:
                return await this.sendEmailMessage(template, order, branch, send)
            case MsgType.sms:
                return await this.sendSmsMessage(template, order, branch, send)
            case MsgType.wa:
                return await this.sendWhatsAppMessage(template, order, branch, send)
            default:
                throw `Message type ${type} not supported!`
        }
    }

    async sendWhatsAppMessage(template: Template, order: Order, branch: Branch, send: boolean = true): Promise<ApiResult<Message>> {

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

    async sendEmailMessage(template: Template, order: Order, branch: Branch, send: boolean = true): Promise<ApiResult<Message>> {

        if (!order.msg) // messaging disabled for order
            return ApiResult.warning('Messaging disabled for order!')

        if (!branch.emailFrom)
            return ApiResult.error(`Branch 'emailFrom' missing`)

        const contact = order.contact

        if (!contact?.email)
            return ApiResult.error(`Can't send email: contact has no email address`)

        const msg = template.mergeWithOrder(order, branch)

        msg.from = new MessageAddress(branch.emailFrom, branch.name)

        if (branch.emailBcc)
            msg.addBcc(branch.emailBcc)

        //msg.to.push(order.contact.email)
        //msg.addTo('frank@dvit.eu', 'Frank Paepens')

        if (!msg.conIds)
            msg.conIds = []

        msg.conIds.push(contact.id)

        msg.addTo(contact?.email, contact.name, contact.id)
        //msg.addTo('frank@dvit.eu', contact.name, contact.id)  // contact.email

        msg.type = MsgType.email
        msg.orderId = order?.id

        if (send) {

            const sendRes = await this.alteaDb.db.sendMessage$(msg)
            console.warn(sendRes)
        }

        return new ApiResult(msg)
    }

    async sendSmsMessage(template: Template, order: Order, branch: Branch, send: boolean = true): Promise<ApiResult<Message>> {

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