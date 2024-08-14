


import { Branch,  DepositMode, Gender, Gift, IEmail, Invoice, LoyaltyCard, Message, MessageDirection, MsgType, Order, OrderLine, OrderType, Organisation, PlanningMode, Product, ProductResource, ProductType, ResourcePlanning, Schedule, Subscription, User, UserBase } from "ts-altea-model";
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


export enum TemplateType {
    general = 'general',
    confirmation = 'confirmation',
    cancel = 'cancel',
    cancelClient = 'cancelClient',
    cancelProvider = 'cancelProvider',
    change = 'change',
    reminder = 'reminder',
    waitDeposit = 'waitDeposit',
  
  }
  /*
  export enum OrderTemplate {
    noDepositCancel = 'noDepositCancel'
  }
  */
  export const orderTemplates = ['resv_wait_deposit', 'resv_remind_deposit', 'resv_confirmation',
    'resv_no_deposit_cancel', 'resv_in_time_cancel', 'resv_late_cancel', 'resv_change_date',
    'resv_reminder', 'resv_no_show', 'resv_satisfaction', 'resv_internal_cancel']
  
  
  export enum TemplateCode {
    resv_wait_deposit = 'resv_wait_deposit',
    resv_remind_deposit = 'resv_remind_deposit',
    resv_confirmation = 'resv_confirmation',
    resv_no_deposit_cancel = 'resv_no_deposit_cancel',
    resv_in_time_cancel = 'resv_in_time_cancel',
    resv_late_cancel = 'resv_late_cancel',
    resv_change_date = 'resv_change_date',
    /** Reminder for reservation */
    resv_reminder = 'resv_reminder',
    resv_no_show = 'resv_no_show',
    resv_satisfaction = 'resv_satisfaction',
    resv_internal_cancel = 'resv_internal_cancel'
  }
  
  /*
  cancel
  cancelClient
  cancelProvider
  */
  export enum TemplateRecipient {
    unknown = 'unknown',
    client = 'client',
    staff = 'staff',
    provider = 'provider'
  }
  
  export enum TemplateChannel {
    email = 'email',
    sms = 'sms'
  }
  
  export class TemplateAction {
    label?: string
    url?: string
  }
  
  
  export enum TemplateFormat {
    text = 'text',
    html = 'html'
  }
  
  export class Template extends ObjectWithIdPlus {
  
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
  
    //fruit = 'pomme'
  
    isEmail(): boolean {
      return (Array.isArray(this.channels) && _.includes(this.channels, 'email'))
    }
  
    isSms(): boolean {
      return (Array.isArray(this.channels) && _.includes(this.channels, 'sms'))
    }
  
    msgType(): MsgType {
  
      if (!Array.isArray(this.channels) || this.channels.length == 0)
        return MsgType.email
  
      return this.channels[0] as MsgType
    }
  
  
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
  
  
    mergeWithOrder(order: Order, branch: Branch): Message {
  
      const message = new Message()
  
      message.branchId = order.branchId
      message.orderId = order.id
      message.code = this.code
      message.dir = MessageDirection.out
      message.auto = true   //this is automatic message
      message.fmt = this.format
  
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
  
      message.type = this.msgType()
  
      return message
  
    }
  
  }
  