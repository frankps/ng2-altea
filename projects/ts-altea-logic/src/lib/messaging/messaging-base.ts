import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MessageAddress, TemplateCode, Contact, MessageDirection, TemplateFormat } from 'ts-altea-model'
import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import { ApiListResult, ApiResult, ApiStatus, ArrayHelper } from 'ts-common'


export class MessagingBase {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    async sendWhatsApp(msg: Message, contact: Contact, send: boolean = true): Promise<ApiResult<Message>> {


        console.warn(msg)

        if (!msg.conIds)
            msg.conIds = []

        msg.conIds.push(contact.id)

        msg.addTo(contact.mobile, contact.name, contact.id)  // contact.email

        msg.type = MsgType.wa
       
        if (send) {

            const sendRes = await this.alteaDb.db.sendMessage$(msg)
            //const sendRes = new ApiResult(msg)
            console.warn(sendRes)

        }

        return new ApiResult(msg)
    }

        // get non active orders: state=creation, older then 15min,
        async sendAdminMessage(subject: string, body: string) {

            const msg = new Message()
    
            msg.subj = subject
            msg.body = body
    
            msg.from = new MessageAddress('info@aquasense.be', 'Aquasense')
            msg.addTo('frank.newsly@gmail.com', 'Frank')
           // msg.addTo('hilde@aquasense.be', 'Hilde')
            msg.type = MsgType.email
            msg.auto = true
            msg.dir = MessageDirection.out
            msg.fmt = TemplateFormat.html
    
            await this.alteaDb.db.sendMessage$(msg)
        }

}