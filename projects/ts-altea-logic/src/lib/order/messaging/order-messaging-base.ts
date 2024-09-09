import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, ResourceAvailability, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MessageAddress, TemplateCode } from 'ts-altea-model'
import { AlteaDb } from '../../general/altea-db'
import { IDb } from '../../interfaces/i-db'
import { ArrayHelper } from 'ts-common'


export class OrderMessagingBase {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    async sendMessages(templateCode: TemplateCode | string, order: Order, branch: Branch, send: boolean = true, ...types: MsgType[]) {

        /** if types (email, sms, wa=WhatsApp) are not specified explicitly, then we use preferred contact message types */
        if (ArrayHelper.IsEmpty(types)) {

            types = order.contact.msg
            /* console.warn(`No messages to send: types array is empty`)
            return */
        }


        if (ArrayHelper.IsEmpty(types)) {
          /*  console.warn(`No messages to send: types array is empty`)
            return */

            console.warn(`Contact has no preffered types specified: fall-back to email`)
            types = [ MsgType.email ]

        }

        let templates = await this.alteaDb.getTemplates(order.branchId, templateCode)

        for (let type of types) {

            let template = templates.find(tpl => tpl.channels.indexOf(type) >= 0 )

            if (!template)
                template = templates.find(tpl => tpl.channels.indexOf(MsgType.email) >= 0)

            if (!template) {
                console.error(`No template found ${templateCode} and channel/type ${type}`)
            }


            await this.sendMessage(type, template, order, branch, send)
        }



        /**
         * Some message types work with internal templates (from DB): email, sms
         * other message types (whatsapp) work with templates configured in those systems => no need to lookup template
         

        const typesInternalTemplates = types.filter(type => type != MsgType.wa)

        if (ArrayHelper.NotEmpty(typesInternalTemplates)) {


        }

        */
    }


    async sendMessage(type: MsgType, template: Template, order: Order, branch: Branch, send: boolean = true): Promise<Message> {

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

    async sendWhatsAppMessage(template: Template, order: Order, branch: Branch, send: boolean = true): Promise<Message> {

        const contact = order.contact

        const msg = template.mergeWithOrder(order, branch, false)

        if (!msg.conIds)
            msg.conIds = []

        msg.conIds.push(contact.id)


        msg.addTo(contact.mobile, contact.name, contact.id)  // contact.email

        msg.type = MsgType.wa

        if (send) {

            const sendRes = await this.alteaDb.db.sendMessage$(msg)
            console.warn(sendRes)

        }

        return msg

    }

    async sendEmailMessage(template: Template, order: Order, branch: Branch, send: boolean = true): Promise<Message> {

        const contact = order.contact

        const msg = template.mergeWithOrder(order, branch, true)


        msg.from = new MessageAddress(branch.emailFrom, branch.name)

        if (branch.emailBcc)
            msg.addBcc(branch.emailBcc)

        //msg.to.push(order.contact.email)
        //msg.addTo('frank@dvit.eu', 'Frank Paepens')

        if (!msg.conIds)
            msg.conIds = []

        msg.conIds.push(contact.id)

        msg.addTo('frank@dvit.eu', contact.name, contact.id)  // contact.email

        msg.type = MsgType.email

        if (send) {

            const sendRes = await this.alteaDb.db.sendMessage$(msg)
            console.warn(sendRes)

        }

        return msg
    }

    async sendSmsMessage(template: Template, order: Order, branch: Branch, send: boolean = true): Promise<Message> {

        const msg = template.mergeWithOrder(order, branch, false)

        msg.addTo(order.contact.mobile, order.contact.getName(), order.contact.id)
        msg.type = MsgType.sms

        if (send) {

            const sendRes = await this.alteaDb.db.sendMessage$(msg)
            console.warn(sendRes)

        }

        return msg
    }
}