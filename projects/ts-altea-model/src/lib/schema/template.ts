


import { Branch, Message, MessageDirection, MsgType, Order, TemplateAction, TemplateFormat, TextComponent, TextParameter, WhatsAppBodyComponent, WhatsAppHeaderComponent, WhatsAppTemplateComponent } from "ts-altea-model";
import 'reflect-metadata';
import { ArrayHelper, DateHelper, ObjectWithIdPlus, StringHelper } from 'ts-common'
import * as _ from "lodash";

import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import { ObjectWithParameters } from "./object-with-parameters";
import * as CryptoJS from 'crypto-js'

/*
export enum OrderTemplate {
  noDepositCancel = 'noDepositCancel'
}
*/
export const orderTemplates = ['resv_wait_deposito', 'resv_remind_deposit', 'resv_confirmation',
  'resv_no_deposit_cancel', 'resv_in_time_cancel', 'resv_late_cancel', 'resv_change_date',
  'resv_reminder', 'resv_no_show', 'resv_satisfaction', 'resv_internal_cancel']






export class Template extends ObjectWithParameters {

  orgId?: string
  branchId?: string
  idx = 0

  to: string[] = []
  channels: string[] = []

  /** category (example: order) */
  cat?: string

  code?: string | null
  name?: string | null
  lang?: string | null
  subject?: string | null
  body?: string | null
  short?: string | null
  remind = 60

  footer?: string | null
  actions: TemplateAction[] = []

  format: TemplateFormat = TemplateFormat.text

  /** external id: example Whatsapp id (we export templates to Whatsapp) */
  extId?: string

  hash: string

  isEmail(): boolean {
    return (Array.isArray(this.channels) && _.includes(this.channels, 'email'))
  }

  isSms(): boolean {
    return (Array.isArray(this.channels) && _.includes(this.channels, 'sms'))
  }

  isType(type: MsgType | string) {
    return (Array.isArray(this.channels) && _.includes(this.channels, type))
  }

  msgType(): MsgType {

    if (!Array.isArray(this.channels) || this.channels.length == 0)
      return MsgType.email

    return this.channels[0] as MsgType
  }

  generateHash(text: string): string {
    return CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex)
  }

  createTemplateHash(): string {
    let input = ''

    if (!StringHelper.isEmptyOrSpaces(this.subject)) input += this.subject
    if (!StringHelper.isEmptyOrSpaces(this.body)) input += this.body

    const hash = this.generateHash(input)

    return hash
  }

  hashChanged(): boolean {
    const hash = this.createTemplateHash()

    return (hash != this.hash)
  }

  /**
   * 
   * @returns true if hash changed and as such updated, else false
   */
  updateHash(): boolean {

    const hash = this.createTemplateHash()

    if (hash != this.hash) {
      this.hash = hash
      this.markAsUpdated('hash')
      return true
    } else {
      return false
    }

  }



  updateParameters() {
    const params: TextParameter[] = []
    params.push(...this.getBodyParameters())

    this.params = params
    this.markAsUpdated('params')
  }

  getBodyParameters(): TextParameter[] {
    const params = this.extractParameters(TextComponent.body, this.body)
    return params
  }

  getWhatsAppComponents(...comps: TextComponent[]): WhatsAppTemplateComponent[] {

    if (ArrayHelper.IsEmpty(comps))
      comps = [TextComponent.subject, TextComponent.body]

    const whatsAppComponents = []

    for (let comp of comps) {
      let waComp = this.getWhatsAppComponent(comp)

      if (waComp)
        whatsAppComponents.push(waComp)
    }

    return whatsAppComponents
  }

  replaceParamNamesWithNumbers(text: string, paramNames: string[], startAt = 1) {

    if (ArrayHelper.IsEmpty(paramNames))
      return text

    for (let param of paramNames) {
      text = text.replaceAll(param, '' + (startAt++))
    }

    return text

  }

  getWhatsAppComponent(comp: TextComponent): WhatsAppTemplateComponent {

    switch (comp) {

      case TextComponent.body: {

        if (StringHelper.isEmptyOrSpaces(this.body))
          return null


        const bodyParams = this.getParameterNames(TextComponent.body)
        let body = this.replaceParamNamesWithNumbers(this.body, bodyParams)

        const bodyComponent = new WhatsAppBodyComponent(body, bodyParams)

        return bodyComponent

        break
      }

      case TextComponent.subject: {


        if (StringHelper.isEmptyOrSpaces(this.subject))
          return new WhatsAppHeaderComponent("")

        const headerParams = this.getParameterNames(TextComponent.subject)
        let header = this.replaceParamNamesWithNumbers(this.subject, headerParams)

        const headerComponent = new WhatsAppHeaderComponent(header, headerParams)

        return headerComponent

        break
      }


      default:
        throw new Error('Not implemented!')

    }


  }



  getParameterNames(comp: TextComponent): string[] {

    switch (comp) {
      case TextComponent.body:
        return this.extractParameterNames(this.body)
      case TextComponent.subject:
        return this.extractParameterNames(this.subject)
      default:
        throw new Error('Not yet implemented')
    }

  }

  //getBodyParameterNames(): str

  getTerm(order: Order): string {

    const trans = {
      min: { si: 'minuut', pl: 'minuten' },
      hou: { si: 'uur', pl: 'uren' },
      day: { si: 'dag', pl: 'dagen' },
    }

    if (!order || !order.depositBy)
      return ''

    var depositByDate = DateHelper.parse(order.depositBy)
    const now = new Date()

    const minutes = dateFns.differenceInMinutes(depositByDate, now)

    if (minutes < 60)
      return `${minutes} ${minutes == 1 ? trans.min.si : trans.min.pl}`


    const hours = Math.floor(minutes / 60)

    if (hours < 24)
      return `${hours} ${hours == 1 ? trans.hou.si : trans.hou.pl}`

    var days = Math.floor(hours / 24)

    return `${days} ${days == 1 ? trans.day.si : trans.day.pl}`

  }


  mergeWithOrder(order: Order, branch: Branch, merge: boolean): Message {

    const message = new Message()

    message.branchId = order.branchId
    message.orderId = order.id
    message.code = this.code
    message.dir = MessageDirection.out
    message.auto = true   //this is automatic message
    message.fmt = this.format

    /** local templating */
    if (merge) {

      const replacements = {
        branch: branch.name,
        deposit: `€${order.deposit}`,
        term: this.getTerm(order),
        first: order?.contact?.first,
        // info: "baby giraffe"
      }

      if (this.body) {
        const hbTemplate = Handlebars.compile(this.body)
        message.body = hbTemplate(replacements)
      }

      if (this.subject) {
        const hbTemplate = Handlebars.compile(this.subject)
        message.subj = hbTemplate(replacements)
      }

    } else {

      /** remote templating: whatsapp has it's own template system 
       * => we will just pass the template id and the parameters
      */

      //message.addTextParameter(TextComponent.subject, 'branch', 1, 'Aquasense')

      message.addTextParameter('branch', 'Aquasense')
      message.addTextParameter('deposit', '€85')
      message.addTextParameter('term', '13h')


    }



    message.type = this.msgType()

    return message

  }

}
