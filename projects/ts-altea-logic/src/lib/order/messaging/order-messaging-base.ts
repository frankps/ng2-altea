import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, ResourceAvailability, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, OrderTemplate, Branch } from 'ts-altea-model'
import { AlteaDb } from '../../general/altea-db'
import { IDb } from '../../interfaces/i-db'


export class OrderMessagingBase {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }

    async createMessage(type: MsgType, template: Template, order: Order, branch: Branch, send: boolean = true): Promise<Message> {

        switch (type) {

            case MsgType.email:
                return await this.createEmailMessage(template, order, branch, send)
            case MsgType.sms:
                return await this.createSmsMessage(template, order, branch, send)
            default:
                throw `Message type ${type} not supported!`
        }
    }

    async createEmailMessage(template: Template, order: Order, branch: Branch, send: boolean = true): Promise<Message> {

        const msg = template.mergeWithOrder(order)

        msg.from = branch.emailFrom

        if (branch.emailBcc)
            msg.bcc.push(branch.emailBcc)

        //msg.to.push(order.contact.email)
        msg.to.push('frank@dvit.eu')
        msg.type = MsgType.email

        if (send) {

            const sendRes = await this.alteaDb.db.sendMessage$(msg)
            console.warn(sendRes)

        }

        return msg
    }

    async createSmsMessage(template: Template, order: Order, branch: Branch, send: boolean = true): Promise<Message> {

        const msg = template.mergeWithOrder(order)

        msg.to.push(order.contact.mobile)
        msg.type = MsgType.sms

        if (send) {

            const sendRes = await this.alteaDb.db.sendMessage$(msg)
            console.warn(sendRes)

        }

        return msg
    }
}