

import { Branch, DepositMode, Gender, Gift, Invoice, LoyaltyCard, Order, OrderLine, OrderType, Organisation, PlanningMode, Product, ProductResource, ProductType, ResourcePlanning, Schedule, Subscription, TemplateFormat, User, UserBase } from "ts-altea-model";
import { Exclude, Type, Transform } from "class-transformer";
import 'reflect-metadata';
import { ArrayHelper, ConnectTo, DateHelper, DbObjectCreate, IAsDbObject, ManagedObject, ObjectHelper, ObjectMgmt, ObjectReference, ObjectWithId, ObjectWithIdPlus, QueryOperator, TimeHelper } from 'ts-common'
import * as _ from "lodash";
import { PersonLine } from "../person-line";
import { DateRange, DateRangeSet, TimeBlock, TimeBlockSet, TimeSpan } from "../logic";
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as sc from 'stringcase'
import { OrderPersonMgr } from "../order-person-mgr";
import { CancelOrderMessage } from "ts-altea-logic";




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

}


export class WhatsAppProviderInfo extends MessageProviderInfo {

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
    error = 'err',
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
    received = '',
    archived = '',
    spam = '',
    deleted = 'fa-duotone fa-circle-trash'
}

/*
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


export class Message extends ObjectWithIdPlus implements IEmail {

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
    state?: MessageState = MessageState.notSent

    /** message format: text or html */
    fmt: TemplateFormat = TemplateFormat.text

    usrId?: string
    /** resource id: internal human resource  */
    resId?: string

    stateColor(): string {
        if (this.state == MessageState.sent)
            return 'green'
        else
            return 'red'
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
