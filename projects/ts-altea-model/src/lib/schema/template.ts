


import { Branch, Message, MessageDirection, MsgType, Order, TemplateAction, TemplateFormat, TextComponent, TextParameter, WhatsAppBodyComponent, WhatsAppButtonComponent, WhatsAppButtonsComponent, WhatsAppHeaderComponent, WhatsAppTemplateComponent, WhatsAppUrlButtonComponent } from "ts-altea-model";
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


<a href="{{pay-link}}" target="_blank">te betalen via deze link</a>
*/
export const orderTemplates = ['resv_wait_deposito', 'resv_remind_deposit', 'resv_confirmation',
  'resv_no_deposit_cancel', 'resv_in_time_cancel', 'resv_late_cancel', 'resv_change_date',
  'resv_reminder', 'resv_no_show', 'resv_satisfaction', 'resv_internal_cancel',
  'gift_online', 'gift_online_from', 'gift_online_to', 'order_compensate_gift', 'order_outstanding_balance',
  'resv_reminder_door_code', 'door_opened', 'door_opened2', 'resv_door_info', 'resv_door_info2']


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


  channelsToString(): string {

    if (ArrayHelper.IsEmpty(this.channels))
      return ''

    let str = this.channels.join(', ')

    return str
  }

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

    input = JSON.stringify(this)
    /*
    if (!StringHelper.isEmptyOrSpaces(this.subject)) input += this.subject
    if (!StringHelper.isEmptyOrSpaces(this.body)) input += this.body

    if (ArrayHelper.NotEmpty(this.actions)) {
      
    }*/

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
      comps = [TextComponent.subject, TextComponent.body, TextComponent.actions]

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
      text = text.replaceAll(`{{${param}}}`, `{{${startAt++}}}`)
    }

    return text

  }

  replaceParamNamesWithValues(text: string, values: Map<string, string>) {

    if (!values)
      return text

    for (let param of values.keys()) {

      const value = values.get(param)

      const toReplace = '{{' + param + '}}'
      const replaceWith = value

      text = text.replaceAll(toReplace, replaceWith)
    }

    return text

  }


  removeParamBrackets(text: string, paramNames: string[]) {

    if (ArrayHelper.IsEmpty(paramNames))
      return text

    for (let param of paramNames) {
      text = text.replaceAll('{{' + param + '}}', param)
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


      case TextComponent.actions: {

        if (ArrayHelper.IsEmpty(this.actions))
          return null

        const whatsappButtons = new WhatsAppButtonsComponent()


        for (let action of this.actions) {

          if (StringHelper.isEmptyOrSpaces(action.url))
            continue

          console.warn(action)

          const paramNames = this.extractParameterNames(action.url)
          let url = this.replaceParamNamesWithNumbers(action.url, paramNames)

          let exampleUrl = null

          if (paramNames.length == 1) {
            exampleUrl = this.removeParamBrackets(action.url, paramNames)
          }

          const button = new WhatsAppUrlButtonComponent(action.label, url, exampleUrl)
          whatsappButtons.buttons.push(button)
        }

        return whatsappButtons.buttons.length > 0 ? whatsappButtons : null

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
      case TextComponent.actions:
        if (ArrayHelper.IsEmpty(this.actions))
          return []

        const urls = this.actions.map(action => action.url)
        return this.extractParameterNamesArray(urls)
      default:
        throw new Error('Not yet implemented')
    }

  }

  //getBodyParameterNames(): str



  getTerm_old(order: Order): string {

    const trans = {
      min: { si: 'minuut', pl: 'minuten' },
      hou: { si: 'uur', pl: 'uren' },
      day: { si: 'dag', pl: 'dagen' },
    }

    if (!order || !order.depoBy)
      return ''

    var depoByDate = DateHelper.parse(order.depoBy)
    const now = new Date()

    const minutes = dateFns.differenceInMinutes(depoByDate, now)

    if (minutes < 60)
      return `${minutes} ${minutes == 1 ? trans.min.si : trans.min.pl}`


    const hours = Math.floor(minutes / 60)

    if (hours < 24)
      return `${hours} ${hours == 1 ? trans.hou.si : trans.hou.pl}`

    var days = Math.floor(hours / 24)

    return `${days} ${days == 1 ? trans.day.si : trans.day.pl}`

  }

  createValueMap(params: string[], allReplacements: any): Map<string, string> {

    const map = new Map<string, string>()

    if (ArrayHelper.IsEmpty(params))
      return map

    for (let param of params) {
      let value = allReplacements[param]
      map.set(param, value)
    }

    return map
  }


  merge(branch: Branch, replacements: any, orderId: string, addParamsForRemoteTemplating: boolean = false): Message {

    const message = new Message()

    message.branchId = branch.id
    message.orderId = orderId
    message.code = this.code
    message.dir = MessageDirection.out
    message.auto = true   //this is automatic message
    message.fmt = this.format

    if (this.body) {
      const hbTemplate = Handlebars.compile(this.body)
      message.body = hbTemplate(replacements)
    }

    if (this.subject) {
      const hbTemplate = Handlebars.compile(this.subject)
      message.subj = hbTemplate(replacements)
    }

    /** important remark: 
 *  Whats App will not use message.body or message.subj, this is just for local storage of messages
 *  => instead we pass parameters (see addParamsForRemoteTemplating): WhatsApp will do the merge of text with parameters
 */

    /** local templating */
    if (addParamsForRemoteTemplating) {

      /** remote templating: whatsapp has it's own template system 
       * => we will just pass the template id and the parameters
      */

      //message.addTextParameter(TextComponent.subject, 'branch', 1, 'Aquasense')


      this.addParameters(TextComponent.subject, replacements, message)

      this.addParameters(TextComponent.body, replacements, message)

      if (ArrayHelper.NotEmpty(this.actions)) {

        let actionIdx = 0
        for (let action of this.actions) {

          let url = action.url
          const paramNames = this.extractParameterNames(url)




          if (ArrayHelper.NotEmpty(paramNames)) {

            const valueMap = this.createValueMap(paramNames, replacements)
            url = this.replaceParamNamesWithValues(url, valueMap)

            var urlPath = new URL(url).pathname
            urlPath = urlPath.substring(1)

            message.addTextParameter('url-path', urlPath, TextComponent.actions, actionIdx)

          }

          actionIdx++
        }

      }

    }



    message.type = this.msgType()

    return message

  }


  /**
   * 
   * @param order 
   * @param branch 
   * @param addParamsForRemoteTemplating some services (like WhatsApp) do the templating themselves => we need to prepare the params to send over
   * @returns 
   */
  mergeWithOrder(order: Order, branch: Branch, addParamsForRemoteTemplating: boolean = false): Message {


    const payLinkPath = `branch/aqua/order/${order.id}/pay-online`
    const payLink = `https://book.birdy.life/${payLinkPath}`

    const headerImage = `<img width='600' class='max-width' style='display:block;color:#000000;text-decoration:none;font-family:Helvetica, arial, sans-serif;font-size:16px;max-width:100% !important;width:100%;height:auto !important;' alt='' src='https://marketing-image-production.s3.amazonaws.com/uploads/17ae7951ff4ef38519fa1a715981599a402f7e4d4b05f8508a5bdf2ff5f738656a4b382fde86d71f28e68b0f9b2124d322ce2b1afdd6028244e8ce986823557f.jpg' border='0'>
<div>&nbsp;</div>`

    const replacements = {
      'header-image': headerImage,
      'branch': branch.name,
      'branch-unique': branch.unique,
      'deposit': `€${order.deposit}`,
      'paid': `€${order.paid}`,
      'cancel-time': '',
      'deposit-time': order.depositTime(),
      'deposit-date': order.depositDate(),
      // term: this.getTerm_old(order),
      'first': order?.contact?.first,
      'name': order?.contact?.name,
      'order-id': order?.id,
      'start-date': order.startDateFormat(),
      'order-lines-html': order.sumToString(),
      'order-lines-text': order.sumToString(true, '\n'),
      'footer': branch.comm?.footer,
      'product-informs': order.productInforms(),
      'pay-link': payLink,
      'pay-link-path': payLinkPath
      //'start-time': order.start
      //'url-path': 'branch/aqua/order/a420eb76-497d-4b4a-a22d-90f9e78d6113/pos-summary'
      // info: "baby giraffe"
    }

    console.warn(replacements)

    // https://altea-pub-app2.web.app/branch/{{branch-short}}/order/{{order-id}}/pos-summary

    // console.warn(replacements)

    let msg = this.merge(branch, replacements, order.id, addParamsForRemoteTemplating)

    return msg

  }

  addParameters(comp: TextComponent, replacements: any, message: Message) {

    const paramNames = this.getParameterNames(comp)

    if (ArrayHelper.NotEmpty(paramNames)) {

      let idx = 1
      for (let paramName of paramNames) {
        let paramValue = replacements[paramName]

        if (!paramValue)
          paramValue = 'MISSING'

        message.addTextParameter(paramName, paramValue, comp, idx++)
      }
    }
  }

}
