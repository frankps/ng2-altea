
import { Branch, DepositMode, Gender, Gift, Invoice, LoyaltyCard, MsgType, Order, OrderLine, OrderType, Organisation, PlanningMode, Product, ProductResource, ProductType, ProviderInfo, Resource, ResourcePlanning, Schedule, Subscription } from "ts-altea-model";
import { Exclude, Type, Transform } from "class-transformer";
import 'reflect-metadata';
import { ArrayHelper, ConnectTo, DateHelper, DbObjectCreate, IAsDbObject, ManagedObject, ObjectHelper, ObjectMgmt, ObjectReference, ObjectWithId, ObjectWithIdPlus, QueryOperator, StringHelper, TimeHelper } from 'ts-common'
import * as _ from "lodash";
import { PersonLine } from "../person-line";
import { DateRange, DateRangeSet, TimeBlock, TimeBlockSet, TimeSpan } from "../logic";
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as sc from 'stringcase'
import { OrderPersonMgr } from "../order-person-mgr";
import { CancelOrderMessage } from "ts-altea-logic";

/**
 * implements shared logic for Contact & User
 */
export class UserBase extends ObjectWithIdPlus {

  first?: string
  last?: string

  /** Allowed messaging for communication (valid strings: see enum MsgType) */
  //msg: string[] = ['email', 'wa', 'sms']
  msg: MsgType[] = [MsgType.email, MsgType.wa, MsgType.sms]

  /** Is the given message type selected? */
  msgTypeSelected(type: any): boolean {
    if (!type || ArrayHelper.IsEmpty(this.msg))
      return false

    return this.msg.indexOf(type) >= 0
  }

  /** check if the same message types are selected (this.msg vs other) */
  hasSameMsg(other: MsgType[]) {

    if (ArrayHelper.IsEmpty(other))
      other = []
    else
      other = other.sort()

    let thisMsg = []

    if (ArrayHelper.NotEmpty(this.msg))
      thisMsg = this.msg.sort()

    const isEqual = _.isEqual(thisMsg, other)

    return isEqual
  }


  selectMsgType(msgType: any, selected: boolean) {

    console.log(msgType, selected)

    if (!this.msg)
      this.msg = []

    if (selected) {

      if (!this.msgTypeSelected(msgType)) {
        this.msg.push(msgType)
        this.m.setDirty('msg')
      }

    } else {

      const idx = this.msg.indexOf(msgType)

      if (idx >= 0) {
        this.msg.splice(idx, 1)
        this.m.setDirty('msg')
      }
    }
  }

  getName(): string {
    let components = []

    if (this.first) {
      this.first = sc.capitalcase(this.first)
      components.push(this.first)
    }

    if (this.last) {
      this.last = sc.capitalcase(this.last)
      components.push(this.last)
    }

    const name = components.join(' ')

    return name

  }


}


export class User extends UserBase {

  uid?: string

  prov?: string
  provId?: string
  provEmail?: string

  @Type(() => ProviderInfo)
  prv?: ProviderInfo = new ProviderInfo()

  /** initial data received from provider (facebook, google) via Firebase */
  prvOrig?: any

  /** user was using multiple accounts (Facebook/Google): use this to block accounts that should not be used  */
  block: boolean = false

  /** to be used when block=true, show this message */
  alert?: string

  email?: string
  mobile?: string

  @Type(() => Contact)
  contacts: Contact[]

  @Type(() => Resource)
  resources: Resource[]

  mobileValid(): boolean {
    console.log(this.mobile)
    const valid = (this.mobile != null && this.mobile != undefined && this.mobile.length > 5)
    console.log(valid)
    return valid
  }

  /** last login date */
  @Type(() => Date)
  public login: Date = new Date()

  constructor() {
    super()
  }

  /**
   * A user can be any consumer logged on to the platform, when a user engages with a specific company (branch),
   * then a contact is created for that user within that branch
   */
  toContact(branchId: string): Contact {
    const contact = new Contact()
    contact.first = this.first
    contact.last = this.last
    contact.branchId = branchId

    contact.setName()

    contact.userId = this.id

    contact.email = this.email
    contact.mobile = this.mobile

    return contact

  }



}


export class Contact extends UserBase {

  //@Type(() => Organisation)
  organisation?: Organisation;

  branch?: Branch;

  orgId?: string
  branchId?: string

  @Type(() => Order)
  orders?: Order[];
  name?: string;


  alert?: string
  remark?: string
  color?: string

  /** a unique code to automatically enter the shop/business (code panel/QR) */
  entry?: string

  /** the uuid of this contact in the entry system */
  entryId?: string

  gender: Gender = Gender.unknown
  birth?: number;  // format: yyyyMMdd
  email?: string;
  /** Email address confirmed */
  emailConf = false

  mobile?: string;
  /** Mobile number confirmed */
  mobileConf = false


  /** Allowed messaging for communication (valid strings: see enum MsgTyp) */
  //msg: string[] = ['email', 'wa']

  phone?: string;

  /** language: iso2, lower case */
  lang?: string;

  str?: string;
  strNr?: string;
  postal?: string;
  city?: string;
  country?: string;

  company?: string;
  vatNum?: string;
  branches?: string[];

  deposit: DepositMode = DepositMode.default
  depositPct?: number

  news: boolean = false
  rules: boolean = false

  /*   active = true
    deleted = false
    deletedAt?: Date; */


  @Type(() => User)
  user?: User
  userId?: string

  @Type(() => Subscription)
  subscriptions?: Subscription[]

  /** gifts given by this contact to others */
  @Type(() => Gift)
  giftsOut?: Gift[]

  /** received gifts (can also be gifts created by system for cancellations) */
  @Type(() => Gift)
  giftsIn?: Gift[]

  @Type(() => LoyaltyCard)
  cards?: LoyaltyCard[]

  constructor() {
    super()

    this.entry = ObjectHelper.createRandomNumberString(4)
  }

  canSendMessageType(msgType: MsgType): boolean {

    if (!this.msgTypeSelected(msgType))
      return false

    switch (msgType) {
      case MsgType.email:
        return StringHelper.isEmail(this.email)

      case MsgType.wa:
      case MsgType.sms:
        return StringHelper.isMobileNumber(this.mobile)

    }

    return false
  }

  getAddress(sep: string = '\n'): string {
    return `${this.str} ${this.strNr}${sep}${this.postal} ${this.city}`
  }


  hasGiftsIn(): boolean {
    return ArrayHelper.NotEmpty(this.giftsIn)
  }

  hasGiftsOut(): boolean {
    return ArrayHelper.NotEmpty(this.giftsOut)
  }

  setName() {

    let components = []

    if (this.first) {
      this.first = sc.capitalcase(this.first)
      components.push(this.first)
    }

    if (this.last) {
      this.last = sc.capitalcase(this.last)
      components.push(this.last)
    }

    if (components.length == 0 && this.company)
      components.push(this.company)

    this.name = components.join(' ')
    this.m.setDirty('name')
  }



}
