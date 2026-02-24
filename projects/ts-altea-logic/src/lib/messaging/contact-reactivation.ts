
import { ApiListResult, ApiResult, ApiStatus, ArrayHelper, DateHelper, DbObject, DbQuery, DbQueryTyped, HtmlDoc, HtmlTable, HtmlText, HtmlTextType, ObjectHelper, QueryOperator } from 'ts-common'
import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MsgInfo, TemplateCode, CustomerCancelReasons, MessageAddress, MessageDirection, TemplateFormat, Contact, ReviewStatus, ReviewPlatform, TemplateMessage } from 'ts-altea-model'
import { Observable } from 'rxjs'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"
import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import { MessagingBase } from './messaging-base'


export class ContactReactivationError {

    contact: Contact
    template: Template
    message: Message

    result: ApiResult<Message>

    constructor(contact: Contact, template: Template, message: Message, result: ApiResult<Message>) {
        this.contact = contact
        this.template = template
        this.message = message
        this.result = result
    }



}

export class ContactReactivationInput {

    codes: string[]

}

export class ContactReactivation extends MessagingBase {


    constructor(db: IDb | AlteaDb) {
        super(db)
    }

    delay = (ms: number) => new Promise(res => setTimeout(res, ms))


    daysAgo(order: Order): number {

        if (!order)
            return 0

        let daysAgo = dateFns.differenceInDays(new Date(), order.startDate)

        return daysAgo

    }

    async reactivateContacts(templateCode: string = null, testOnly: boolean = true) {   // 

        let me = this

        let batchSize = 5
        let maxBatches = 2

        let aquasenseId = '66e77bdb-a5f5-4d3d-99e0-4391bded4c6c'

       // let testOnly = false   // then an individual contact is processed: to check if message is merged & sent correctly

        let sendWhatsApp = true  // also for debugging

        let branch = await this.alteaDb.getBranch(aquasenseId)

        let templateCategory = 'reactivation'
        let allReactivationTemplates = await this.alteaDb.getTemplatesByCategory(aquasenseId, templateCategory, templateCode, 'products.product')  // .product

        /** we can have different versions/variations of a template with the same code, the suffix is used to distinguish them */
        let codes = this.getCodes(allReactivationTemplates)


        const htmlDoc = new HtmlDoc()

        let messageCount = 0


        /** Get all mobile numbers that have already received a message for the last 14 days (any template of the reactivation category):
 * we don't want to spam people (across all templates)
 */
        let alreadyReceivedReactivationMobileNumbers = []

        if (!testOnly)
            alreadyReceivedReactivationMobileNumbers = await this.alteaDb.getMobileNumbersAlreadyTargetedForCategory(aquasenseId, templateCategory, 5)

        if (ArrayHelper.IsEmpty(alreadyReceivedReactivationMobileNumbers))
            alreadyReceivedReactivationMobileNumbers = []


        /*         console.log(testContact)
                return */

        for (let code of codes) {

            htmlDoc.add(new HtmlText(`${code} reactivation`, HtmlTextType.h1))


            let specificTemplates = allReactivationTemplates.filter(t => t.code == code)

            let productIds = this.getAllProductIds(specificTemplates)

            // let productNames = this.getAllProductNames(specificTemplates)


            /**  there can exist different templates for same template code. For instance [90,60]
             => after 60 days we sent a soft message, but after 90 days we sent a stronger message
            */
            let distinctReminds = this.getDistinctReminds(specificTemplates, 'desc')
            distinctReminds = [10000, ...distinctReminds]

            for (let idx = 0; idx < distinctReminds.length - 1; idx++) {

                let fromDaysAgo = distinctReminds[idx]
                let toDaysAgo = distinctReminds[idx + 1]



                const htmlTable = new HtmlTable()

                let errors: ContactReactivationError[] = []



                let remindCount = 0




                let contacts: Contact[]
                // let contacts = await this.alteaDb.getSleepingContacts(aquasenseId, fromDaysAgo, toDaysAgo, productIds)


                /** Sometimes we have different contacts with same mobile number (duplicate contacts, husband/wife, etc.) 
                 *  We don't want to send same message twice.
                */
                let alreadyReceivedTemplateMobileNumbers = []

                if (!testOnly)
                    alreadyReceivedTemplateMobileNumbers = await this.alteaDb.getMobileNumbersAlreadyTargetedForTemplate(aquasenseId, templateCategory, code, toDaysAgo)

                if (ArrayHelper.IsEmpty(alreadyReceivedTemplateMobileNumbers))
                    alreadyReceivedTemplateMobileNumbers = []

                let templatesForPeriod = specificTemplates.filter(t => t.remind == toDaysAgo)

                let contactBatch = 0
                let nextCursorId = null

                while (true) {

                    if (testOnly) {
                        let debugContactId = 'a13baec9-e21a-4fbb-ac2e-a716dea361b6'  // Frank Paepens

                        let deleteResult = await this.alteaDb.deleteTemplateMessagesForContact(debugContactId)
                        console.log(deleteResult)

                        contacts = await this.alteaDb.getSleepingContactsDebug(debugContactId, code, toDaysAgo)
                    }
                    else {

                        let cursorId = nextCursorId  // continue from last contact (as from second loop onwards)

                        contacts = await this.alteaDb.getSleepingContacts(aquasenseId, fromDaysAgo, toDaysAgo, productIds, code, toDaysAgo, cursorId, batchSize)

                        if (ArrayHelper.IsEmpty(contacts))  // no more contacts to process
                            break

                        nextCursorId = contacts[contacts.length - 1].id

                    }

                    let contactInBatch = 0

                    const alreadyReceivedMobileNumbers = _.union(alreadyReceivedReactivationMobileNumbers, alreadyReceivedTemplateMobileNumbers)
                    //contacts = this.removeContactsAlreadySent(contacts, alreadyReceivedMobileNumbers)

                    if (ArrayHelper.IsEmpty(contacts))
                        continue

                    contactBatch++  // we start processing the next contact batch

                    let messages: TemplateMessage[] = []

                    for (let contact of contacts) {

                        if (!contact.mobile)
                            continue

                        if (this.alreadyReceived(contact.mobile, alreadyReceivedMobileNumbers))
                            continue

                        let template = this.takeRandomTemplate(templatesForPeriod)

                        if (!template)  // should NOT happen
                            continue

                        let message = new Message()

                        let replacements = {
                            'product-slug': template.firstProductSlug(),
                            'message-id': message.id
                        }

                        message = template.mergeWithContact(contact, branch, true, replacements, message)
                        //console.log(message)


                        // Add & save a TemplateMessage object
                        let templateMessage = TemplateMessage.create(template.id, contact.id, templateCategory, code, template.suffix, toDaysAgo)
                        templateMessage.id = message.id
                        templateMessage.to = contact.mobile  // because we send Whatsapp to mobile number
                        messages.push(templateMessage)

                        var sendResult: ApiResult<Message>

                        if (sendWhatsApp) {
                            try {
                                sendResult = await this.sendWhatsApp(message, contact)

                                if (sendResult.status == ApiStatus.ok)
                                    me.addMobileNumberToAlreadyReceived(contact.mobile, alreadyReceivedReactivationMobileNumbers, alreadyReceivedTemplateMobileNumbers)

                                console.log(sendResult)
                            } catch (error) {
                                console.error(error)
                                sendResult = ApiResult.error(error.message)

                            } finally {
                                if (sendResult.status != ApiStatus.ok) {
                                    errors.push(new ContactReactivationError(contact, template, message, sendResult))
                                    templateMessage.success = false
                                    templateMessage.result = sendResult
                                } else {
                                    templateMessage.success = true
                                }
                            }
                        }

                        let daysAgo = null

                        if (ArrayHelper.NotEmpty(contact?.orders))
                            daysAgo = me.daysAgo(contact.orders[0])

                        const cols: string[] = [`${messageCount}`, `${contactInBatch}`, contact.name, `${daysAgo}`, template.code, template.productNamesAsString(), sendResult?.status]
                        htmlTable.addRow(cols)

                        if (sendWhatsApp)
                            await me.delay(100);

                        messageCount++
                        remindCount++
                        contactInBatch++
                    }


                    var msgSave = await this.alteaDb.createTemplateMessages(messages)
                    console.log(msgSave)



                    if (testOnly)
                        break  // we just process 1 contact (already done)


                    if (sendWhatsApp)
                        await me.delay(1500); // inter-batch pause


                    if (contactBatch >= maxBatches)
                        break

                }


                htmlDoc.add(new HtmlText(`${code} reactivation for interval [${fromDaysAgo} - ${toDaysAgo}]`, HtmlTextType.h2))

                htmlDoc.add(new HtmlText(`Nr of messages: ${remindCount}`, HtmlTextType.p))
                htmlDoc.add(htmlTable)




            }

        }

        let subject = `Contact reactivation: ${codes.join(', ')}`
        let body = htmlDoc.toHtmlString()

        await this.sendAdminMessage(subject, body)

    }


    addMobileNumberToAlreadyReceived(mobileNumber: string, ...alreadyReceivedMobileLists: string[][]) {
        if (!mobileNumber)
            return

        for (let alreadyReceivedMobileList of alreadyReceivedMobileLists) {
            if (ArrayHelper.IsEmpty(alreadyReceivedMobileList))
                continue

            if (this.alreadyReceived(mobileNumber, alreadyReceivedMobileList))
                continue

            const cleanedMobileNumber = mobileNumber.replace(/\D+/g, "");

            alreadyReceivedMobileList.push(cleanedMobileNumber)
        }
    }


    cleanMobile(raw?: string | null): string | null {
        if (!raw) return null;
        const digits = raw.replace(/\D+/g, "");      // drop non-numeric
        if (!digits) return null;
        const last9 = digits.slice(-9);              // keep rightmost 9
        return last9;
    }


    alreadyReceived(address: string, alreadyReceivedMobileNumbers: string[]): boolean {
        if (!address || ArrayHelper.IsEmpty(alreadyReceivedMobileNumbers))
            return false

        let cleanedAddress = this.cleanMobile(address)

        return alreadyReceivedMobileNumbers.some(item => item?.indexOf(cleanedAddress) >= 0)
    }


    removeContactsAlreadySent(contacts: Contact[], alreadyReceivedMobileNumbers: string[]): Contact[] {
        if (ArrayHelper.IsEmpty(contacts))
            return []

        if (ArrayHelper.IsEmpty(alreadyReceivedMobileNumbers))
            return contacts

        let validContactsNotYetSent = contacts.filter(c => {
            let cleanedMobile = this.cleanMobile(c.mobile)

            if (!cleanedMobile)
                return false

            return !alreadyReceivedMobileNumbers.includes(cleanedMobile)
        })

        return validContactsNotYetSent
    }



    async getTemplates() {

        let templates: Template[] = []

        let aquasenseId = '66e77bdb-a5f5-4d3d-99e0-4391bded4c6c'

        let template = new Template()
        template.orgId = aquasenseId
        template.branchId = aquasenseId
        template.cat = 'reactivatie'
        template.name = 'Suiker ontharing reactivatie'
        template.code = 'suiker_ontharing_reactivatie'
        template.body = 'Hello {{name}}, Voor een optimaal resultaat van de suikerontharing en om langer haarloos te zijn is het belangrijk dit het hele jaar door te doen zonder te scheren tussendoor.'
        template.channels = ['wa']
        template.remind = 45;
        template.format = TemplateFormat.text
        template.lang = 'nl'

        let suikerOntharingId = '5e0f259f-b57c-4e45-b75f-1aad81a29cf6'
        template.addProduct(suikerOntharingId)

        templates.push(template)

        return templates

    }



    getCodes(templates: Template[]) {

        if (ArrayHelper.IsEmpty(templates))
            return []

        let codes = templates.map(t => t.code)

        codes = _.uniq(codes)

        return codes

    }


    getMinRemind(templates: Template[]) {

        if (ArrayHelper.IsEmpty(templates))
            return 0

        let reminds = templates.map(t => t.remind)

        return _.min(reminds)
    }

    getDistinctReminds(templates: Template[], sortOrder: 'asc' | 'desc' = 'asc'): number[] {

        if (ArrayHelper.IsEmpty(templates))
            return []

        let orderedTemplates = _.orderBy(templates, 'remind', sortOrder)

        let reminds = orderedTemplates.map(t => t.remind)

        reminds = _.uniq(reminds)

        return reminds
    }

    getAllProductIds(templates: Template[]): string[] {

        if (ArrayHelper.IsEmpty(templates))
            return []

        let productIds = templates.flatMap(t => t.products.map(p => p.productId))

        productIds = _.uniq(productIds)

        return productIds

    }

    getAllProductNames(templates: Template[], returnAsString = true): string {

        if (ArrayHelper.IsEmpty(templates))
            return ''

        let productNames = templates.flatMap(t => t.products.map(p => p.product.name))

        productNames = _.uniq(productNames)

        return productNames.join(', ')
        // return returnAsString ? productNames.join(', ') : productNames

    }

    takeRandomTemplate(templates: Template[]): Template {

        if (ArrayHelper.IsEmpty(templates))
            return null

        let randomId = Math.floor(Math.random() * templates.length)
        return templates[randomId]
    }

    async executeTemplate(template: Template) {

        /*         let productIds = template.productIds()
                let contacts = await this.alteaDb.getSleepingContacts(template.orgId, 60, productIds)
        
        
                for (let contact of contacts) {
        
                    template.mergeWithOrder
                    let message = new Message()
         
                }
        
        
                console.log(contacts) */

    }

}