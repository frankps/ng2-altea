
import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, ResourceAvailability, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MessageAddress, TemplateCode, Gift, TemplateFormat, MessageDirection, GiftType, GiftTemplateCode } from 'ts-altea-model'
import { AlteaDb } from '../../general/altea-db'
import { IDb } from '../../interfaces/i-db'
import { ApiListResult, ApiResult, ApiStatus, ArrayHelper, StringHelper } from 'ts-common'
import * as Handlebars from "handlebars"


export class DefaultGiftText {
    toMessagePrefix = `Mijn boodschap aan jou:`
}


export class GiftMessaging {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    async fulfillGiftOrder(order: Order): Promise<ApiResult<any>> {

        let allOk = true

        let results = []

        try {

            let branch: Branch = await this.alteaDb.getBranch(order.branchId)
            let gift: Gift = await this.alteaDb.getGiftByOrderId(order.id)

            if (!gift) {
                let msg = `Gift not found for order ${order.id}`
                results.push(msg)
                return ApiResult.error(msg)
            }

            if (gift.methods.emailFrom) {

                let res = await this.send(branch, gift, GiftTemplateCode.gift_online_from, true)

                if (res.isOk) {

                    results.push(`Gift email to fromEmail:${gift.fromEmail} send successfully (template: gift_online_from)`)
                }
                else {
                    allOk = false
                    results.push(`Problem sending email to fromEmail:${gift.fromEmail} (template: gift_online_from)`)

                    if (res.message)
                        results.push(`<i>${res.message}</i>`)
                }


            } else if (gift.methods.emailTo) {

                let res = await this.send(branch, gift, GiftTemplateCode.gift_online_to, true)

                if (res.isOk) {
                    results.push(`Gift email to toEmail:${gift.toEmail} send successfully (template: gift_online_to)`)
                }
                else {
                    allOk = false
                    results.push(`Problem sending email to toEmail:${gift.toEmail} send successfully (template: gift_online_to)`)

                    if (res.message)
                        results.push(`<i>${res.message}</i>`)
                }

            }

        } catch (err) {
            results.push(`<i>${err}</i>`)
        }


        return new ApiResult(this)


    }

    async send(branch: Branch, gift: Gift, templateCode: GiftTemplateCode, send: boolean = true): Promise<ApiResult<Message>> {

        let template = await this.alteaDb.getTemplate(gift.branchId, templateCode, MsgType.email)

        let msg = this.merge(branch, template, gift)

        if (send) {

            const sendRes = await this.alteaDb.db.sendMessage$(msg)
            console.warn(sendRes)
            return sendRes
        }


        return new ApiResult(msg)

    }



    merge(branch: Branch, template: Template, gift: Gift, defaultText = new DefaultGiftText()): Message {

        const msg = new Message()

        msg.branchId = gift.branchId
        //message.orderId = order.id
        msg.code = template.code
        msg.dir = MessageDirection.out
        msg.auto = true   //this is automatic message
        msg.fmt = TemplateFormat.html

        msg.from = new MessageAddress(branch.emailFrom, branch.name)

        if (template.code == GiftTemplateCode.gift_online_from && gift.fromEmail) {
            msg.addTo(gift.fromEmail, gift.fromName)
        } else {

        //if (template.code == GiftTemplateCode.gift_online_to && gift.toEmail) {
            msg.addTo(gift.toEmail, gift.toName)

            if (gift.fromEmail)
                msg.addCc(gift.fromEmail, gift.fromName)
        }

        msg.addBcc('contact@aquasense.be')
        //msg.addBcc('frank.newsly@gmail.com')

        let giftContents = ''

        let indent: string = '&nbsp;&nbsp;'
        let lineSeparator: string = '<br>'

        if (gift.isAmount() || ArrayHelper.IsEmpty(gift.lines)) {
            giftContents = `Jouw cadeaubon heeft een waarde van €${gift.value}`
        } else {

            let contentLines = [`Deze cadeaubon omvat:`]

            for (let line of gift.lines) {
                contentLines.push(`${indent} ${line.qty} x ${line.descr}`)
            }

            giftContents = contentLines.join(lineSeparator)
        }

        const headerImage = `<img width='600' class='max-width' style='display:block;color:#000000;text-decoration:none;font-family:Helvetica, arial, sans-serif;font-size:16px;max-width:100% !important;width:100%;height:auto !important;' alt='' src='https://marketing-image-production.s3.amazonaws.com/uploads/17ae7951ff4ef38519fa1a715981599a402f7e4d4b05f8508a5bdf2ff5f738656a4b382fde86d71f28e68b0f9b2124d322ce2b1afdd6028244e8ce986823557f.jpg' border='0'>
<div>&nbsp;</div>`

        const giftImage = `<img width='600' class='max-width' style='display:block;color:#000000;text-decoration:none;font-family:Helvetica, arial, sans-serif;font-size:16px;max-width:100% !important;width:100%;height:auto !important;' alt='' src='https://marketing-image-production.s3.amazonaws.com/uploads/d6b0d9a36c6e84c82a2d2e9da76de0bc99f33b12cbf4c075613f8088d59eea09a5e7ae93967a647fb99b0e6e50d90a470621ad1dd07d484079cf6aa480aa3ca1.jpg' border='0'>`


        let toMessage = ''

        if (!StringHelper.isEmptyOrSpaces(gift.toMessage)) {

            let msgLines = [defaultText.toMessagePrefix, '']

            msgLines.push(gift.toMessage)

            toMessage = msgLines.join(lineSeparator)

        }


        const replacements = {
            'header-image': headerImage,
            'branch': branch.name,
            'branch-unique': branch.unique,
            'from-name': gift.fromName,
            'to-name': gift.toName,
            'to-message': toMessage,
            'gift-code': gift.code,
            'gift-contents': giftContents,
            'gift-image': giftImage,
            'gift-value': `€${gift.value}`,
            'footer': branch.comm?.footer,
        }

        console.warn(replacements)

        if (template.body) {
            const hbTemplate = Handlebars.compile(template.body)
            msg.body = hbTemplate(replacements)
        }

        if (template.subject) {
            const hbTemplate = Handlebars.compile(template.subject)
            msg.subj = hbTemplate(replacements)
        }

        return msg
    }

    /*
{{{header-image}}}

{{{gift-image}}}
    */

}