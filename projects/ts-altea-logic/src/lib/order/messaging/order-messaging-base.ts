import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, ResourceAvailability, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, OrderTemplate, Branch, MessageAddress, TemplateCode } from 'ts-altea-model'
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


    async sendMessages(types: MsgType[], templateCode: TemplateCode, order: Order, branch: Branch, send: boolean = true) {

        if (ArrayHelper.IsEmpty(types)) {
            console.warn(`No messages to send: types array is empty`)
            return
        }

        /**
         * Some message types work with internal templates (from DB): email, sms
         * other message types (whatsapp) work with templates configured in those systems => no need to lookup template
         */
            
        const typesInternalTemplates = types.filter(type => type != MsgType.wa)

        if (ArrayHelper.NotEmpty(typesInternalTemplates)) {
         
            let templates = await this.alteaDb.getTemplates(order.branchId, templateCode)

            for (let type of types) {

                let template = templates.find(tpl => tpl.channels.indexOf(type) >= 0)

                if (!template)
                    template = templates.find(tpl => tpl.channels.indexOf(MsgType.email) >= 0)

                if (!template) {
                    console.error(`No template found ${templateCode} and channel/type ${type}`)
                }


                await this.sendMessage(type, template, order, branch, send)
            }

        }

    } 


    async sendMessage(type: MsgType, template: Template, order: Order, branch: Branch, send: boolean = true): Promise<Message> {

        switch (type) {

            case MsgType.email:
                return await this.sendEmailMessage(template, order, branch, send)
            case MsgType.sms:
                return await this.sendSmsMessage(template, order, branch, send)
            default:
                throw `Message type ${type} not supported!`
        }
    }

    async sendEmailMessage(template: Template, order: Order, branch: Branch, send: boolean = true): Promise<Message> {

        const msg = template.mergeWithOrder(order)

        msg.from = new MessageAddress(branch.emailFrom, branch.name)

        if (branch.emailBcc)
            msg.addBcc(branch.emailBcc)

        //msg.to.push(order.contact.email)
        msg.addTo('frank@dvit.eu', 'Frank Paepens')
        msg.type = MsgType.email

        if (send) {

            const sendRes = await this.alteaDb.db.sendMessage$(msg)
            console.warn(sendRes)

        }

        return msg
    }

    async sendSmsMessage(template: Template, order: Order, branch: Branch, send: boolean = true): Promise<Message> {

        const msg = template.mergeWithOrder(order)

        msg.addTo(order.contact.mobile, order.contact.getName(), order.contact.id)
        msg.type = MsgType.sms

        if (send) {

            const sendRes = await this.alteaDb.db.sendMessage$(msg)
            console.warn(sendRes)

        }

        return msg
    }
}