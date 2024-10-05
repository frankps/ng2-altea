

import { Branch, TemplateFormat } from "ts-altea-model";
import { Exclude, Type, Transform } from "class-transformer";
import 'reflect-metadata';
import { ArrayHelper, DateHelper, ObjectWithIdPlus } from 'ts-common'
import * as _ from "lodash";
import { TextParameter } from "./text-parameter";
import { ObjectWithParameters } from "./object-with-parameters";
//import { ObjectWithParameters } from "./object-with-parameters";


export class IEmail {
    from?: MessageAddress
    to: MessageAddress[]
    cc: MessageAddress[]
    subj?: string
    body?: string
}


export class MessageProviderInfo {

    /** id of this message assigned by provider (ex: whatsapp id) */
    id: string

    /** result */
    res: any

    constructor(id?: string) {
        this.id = id
    }

}

export class MessageWhatsAppInfo extends MessageProviderInfo {

}

export class WhatsAppProviderInfo extends MessageProviderInfo {

    constructor(id: string) {
        super(id)
    }

    /** name of user in provider network/app (ex. whatsapp user name) */
    name: string

    /** the whatsapp phone id used to send/receive this message */
    phoneId: string
}


export class MsgInfo {

    @Exclude()
    date: Date

    on: number

    type: MsgType
    code?: string

    //tags: string[]

    constructor(date: Date, type: MsgType = MsgType.email, code?: string) {  // ...tags: string[]

        this.date = date
        this.on = DateHelper.yyyyMMddhhmmss(date)
        this.type = type
        this.code = code

    }
}


export enum MessageState {
    notSent = 'notSent',
    error = 'error',
    accepted = 'accepted',   // supported by WhatsApp
    delivered = 'delivered', // supported by WhatsApp
    read = 'read', // supported by WhatsApp
    sent = 'sent',
    received = 'rec',
    archived = 'arch',
    spam = 'spam',
    deleted = 'del'
}

export enum MsgStateIcon {
    notSent = 'fa-duotone fa-do-not-enter',
    err = 'fa-duotone fa-circle-exclamation',
    sent = 'fa-duotone fa-circle-check',
    read = 'fa-duotone fa-solid fa-glasses',
    received = '',
    archived = '',
    spam = '',
    deleted = 'fa-duotone fa-circle-trash'
}

/*
<i class="fa-duotone fa-solid fa-glasses"></i>
<i class="fa-duotone fa-circle-exclamation"></i>
<i class="fa-solid fa-do-not-enter"></i>
<i class="fa-duotone fa-circle-check"></i>
<i class="fa-solid fa-circle-trash"></i>
*/

export enum MessageDirection {
    in = 'in',   // incoming message
    out = 'out',  // outgoing message
    int = 'int'   // internal message
}


export enum MsgDirIcon {
    in = 'fa-solid fa-circle-arrow-down',
    out = 'fa-solid fa-circle-arrow-up'
}

export enum MsgDirColor {
    in = 'green',
    out = 'orange'
}

export enum MsgTypeIcon {
    email = 'fa-solid fa-envelope',
    sms = 'fa-solid fa-comment-sms',
    wa = 'fa-brands fa-whatsapp'
}



export class MessageAddress {

    /** address: can be email address, phone number (sms or whatsapp), ... */
    addr: string

    /** the (best) contact id associated with this address */
    conId?: string

    /** the name of the contact */
    name?: string




    constructor(addr: string, name?: string, conId?: string) {
        this.addr = addr
        this.name = name
        this.conId = conId
    }
}



/** Message Types */
export enum MsgType {
    //unknown = 'unknown',

    email = 'email',

    /** WhatsApp */
    wa = 'wa',

    sms = 'sms'
}


/*
    {
      "type": "text",
      "text": "text-string"
    }
*/

/*

export class ObjectWithParametersMessage extends ObjectWithIdPlus {

    // in case external system will do templating (example: Whatsapp) 
    params: TextParameter[]
  
    addTextParameter(comp: 'body' | 'subject' = 'body', name: string, idx?: number, value?: string) {
  
      const param = TextParameter.text(comp, name, idx, value)
  
      if (!this.params)
        this.params = []
  
      this.params.push(param)
    }
  
    extractParameterNames(text: string): string[] {
  
      if (!text)
        return []
  
      const regex = /\{\{(\w+)\}\}/g;
      const matches = [...text.matchAll(regex)].map(match => match[1])
  
      return matches
    }
  
    extractParameters(comp: 'body' | 'subject' = 'body', text: string): TextParameter[] {
      const names = this.extractParameterNames(text)
  
      const params = names.map(name => TextParameter.text(comp, name))
  
      return params
    }
  
  
  }
  */



/**
 * For email & sms we keep track of subj(ect) and body (where parameters of templates are replaced with their values)
 * For whatsapp: we keep track of parameter replacements
 */
export class Message extends ObjectWithParameters implements IEmail {


    branchId?: string
    orderId?: string

    type: MsgType = MsgType.email

    dir: MessageDirection = MessageDirection.in

    /** extra info about message received from provider (ex. whatsapp user name, phoneId, ...) */
    prov: MessageProviderInfo

    /** contact ids: if message related to certain contacts */
    conIds: string[] = []

    /*
    first: string
    last: string
  */

    //  tags: string[] = []

    /** template code */
    code?: string

    sent?: number  // yyyyMMddhhmmss

    from?: MessageAddress

    to: MessageAddress[] = []
    cc: MessageAddress[] = []
    bcc: MessageAddress[] = []

    /** automatic message: message send automatically by system (confirmation, etc) */
    auto: boolean = false

    subj?: string
    body?: string

    log?: string
    state?: MessageState | string = MessageState.notSent  // 

    /** message format: text or html */
    fmt: TemplateFormat = TemplateFormat.text

    usrId?: string
    /** resource id: internal human resource  */
    resId?: string


    constructor() {
        super()

        const now = new Date()
        this.sent = DateHelper.yyyyMMddhhmmss(now)

    }

    static adminEmail(branch: Branch, subject: string, body: string) : Message {

        const msg = new Message()

        msg.addFrom(branch.emailFrom, branch.name)

        msg.addTo(branch.emailBcc)
        
        msg.type = MsgType.email
        msg.dir = MessageDirection.out

        msg.subj = subject
        msg.body = body

        return msg
    }

    static email(subject: string, body: string) : Message {

        const msg = new Message()
        msg.type = MsgType.email
        msg.dir = MessageDirection.out

        msg.subj = subject
        msg.body = body

        return msg
    }


    stateColor(): string {
        /*
        if (this.state == MessageState.sent)
            return 'green'
        else
            return 'red'
*/

        switch (this.state) {
            case MessageState.error:
            case MessageState.notSent:
                return 'red'
            default:
                return 'green'

        }
    }

    createReply(): Message {
        const msg = new Message()

        msg.branchId = this.branchId
        msg.orderId = this.orderId
        msg.type = this.type
        msg.dir = MessageDirection.out
        msg.conIds = this.conIds
        msg.fmt = this.fmt

        switch (this.dir) {
            /* if original was incoming => we repy to the original from */
            case MessageDirection.in:
                if (this.from)
                    msg.to.push(this.from)
                break

            /* if original was already outgoing => we repy to the same outgoing */
            case MessageDirection.out:
                if (ArrayHelper.NotEmpty(this.to))
                    this.to.forEach(t => msg.to.push(t))
                break

        }

        if (this.subj)
            msg.subj = `RE: ${this.subj}`

        return msg
    }

    addFrom(addr: string, name?: string, conId?: string) {
        const msgAddr = new MessageAddress(addr, name, conId)
        this.from = msgAddr
    }

    addTos(addr: string[]) {
        if (ArrayHelper.IsEmpty(addr))
            return

        addr.forEach(addr => this.addTo(addr))
    }

    addTo(addr: string, name?: string, conId?: string) {
        const msgAddr = new MessageAddress(addr, name, conId)
        this.to.push(msgAddr)
    }

    addCc(addr: string, name?: string, conId?: string) {
        const msgAddr = new MessageAddress(addr, name, conId)
        this.cc.push(msgAddr)
    }

    addBcc(addr: string, name?: string, conId?: string) {
        const msgAddr = new MessageAddress(addr, name, conId)
        this.bcc.push(msgAddr)
    }

    sentDate(): Date | null {

        if (!this.sent)
            return null

        const date = DateHelper.parse(this.sent)
        return date
    }

    sentAt(value: Date) {
        this.sent = DateHelper.yyyyMMddhhmmss(value)
    }



}
