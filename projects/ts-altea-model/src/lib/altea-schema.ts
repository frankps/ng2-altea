/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Exclude, Type, Transform } from "class-transformer";
import 'reflect-metadata';
import { ArrayHelper, ConnectTo, DateHelper, DbObjectCreate, IAsDbObject, ManagedObject, ObjectHelper, ObjectMgmt, ObjectReference, ObjectWithId, ObjectWithIdPlus, QueryOperator, TimeHelper } from 'ts-common'
import * as _ from "lodash";
import { PersonLine } from "./person-line";
import { DateRange, DateRangeSet, TimeBlock, TimeBlockSet, TimeSpan } from "./logic";
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as sc from 'stringcase'
import { OrderPersonMgr } from "./order-person-mgr";
import { CancelOrderMessage } from "ts-altea-logic";


function TransformToNumber() {

  return Transform(({ value }) => {
    console.error(value, +value)
    return +value
  }, {})   //toClassOnly: true
}


export class PrismaObjectProperty {
  updateMany = {
    data: []
  }
}
/*
        "language": {
          "nl": "Nederlands",
          "en": "English",
          "fr": "French",
          "sp": "Español"
        },*/

export enum Language {
  nl = 'nl',
  en = 'en',
  fr = 'fr',
  sp = 'sp'
}

export enum Currency {
  AUD = 'AUD',
  CAD = 'CAD',
  CHF = 'CHF',
  CNY = 'CNY',
  EUR = 'EUR',
  GBP = 'GBP',
  HKD = 'HKD',
  JPY = 'JPY',
  NZD = 'NZD',
  USD = 'USD',
}

export enum DaysOfWeekShort {
  mo = 1,
  tu = 2,
  we = 3,
  th = 4,
  fr = 5,
  sa = 6,
  su = 7
}

export enum TimeUnit {
  seconds = 's',
  minutes = 'm',
  hours = 'h',
  days = 'd',
  weeks = 'w',
  months = 'M'
}
/*
"country": {
  "BEL": "België",
  "GBR": "Groot Britanië",
  "NLD": "Nederland",
  "USA": "Verenigde Staten"
},
*/

export enum Country {
  BEL = 'BEL',
  NLD = 'NLD',
  USA = 'USA'

}

export class TimeUnitHelper {

  static numberOfSeconds(unit: TimeUnit): number {

    switch (unit) {
      case TimeUnit.seconds: return 1
      case TimeUnit.minutes: return 60
      case TimeUnit.hours: return 3600
      case TimeUnit.days: return 86400
      case TimeUnit.weeks: return 604800
      case TimeUnit.months: return 18144000
      default: throw `Can not convert ${unit} to seconds`
    }

  }


}

export enum Gender {
  unknown = 'unknown',
  female = 'female',
  male = 'male',
  unisex = 'unisex',
}

export enum OnlineMode {
  //order = 'order',
  reserve = 'reserve',
  visible = 'visible',
  invisible = 'invisible',
}

export enum ProviderIcon {
  facebook = 'fa-brands fa-facebook',
  google = 'fa-brands fa-google'
}


export enum ProductTypeIcons {
  prod = 'fa-duotone fa-box',
  svc = "fa-duotone fa-person-dress",
  /** category */
  cat = "fa-duotone fa-folder-open",

  prod_bundle = "fa-duotone fa-boxes-stacked",
  svc_bundle = "fa-duotone fa-people-dress",

  prod_subs = "fa-duotone fa-id-card",
  svc_subs = "fa-duotone fa-id-card"
}

export enum ProductOnlineIcons {
  reserve = 'fa-solid fa-cart-shopping',
  visible = 'fa-solid fa-eye',
  invisible = 'fa-sharp fa-solid fa-eye-slash'
}


export class ProviderInfo {
  name: 'facebook' | 'google' | 'apple'

  id: string

  email: string



}


export enum PhoneCountryPrefix {
  be = "32"
}


export class ContactMetrics {

  /** Life time value */
  ltv: number = 0

  /** Last visit (format: yyyymmdd) */
  lv: number = 0

  /** */
  v: number = 0


}

export enum DepositMode {
  none = 'none',
  full = 'full',
  default = 'default',
  custom = 'custom'
}

















export enum DurationMode {
  product = 'product',
  custom = 'custom',
}

export enum DurationReference {
  start = 'start',
  end = 'end',
}

export enum SchedulingType {
  active = 'active',
  holiday = 'holiday',
  sick = 'sick',
  course = 'course',
}



export enum OrderType {
  sales = 'sales',
  purchase = 'purchase',
  offer = 'offer',
}






/**
 *  Introduced to store web push subscriptions for users, but any extra JSON can be stored here for any object
 */
export class CustomJson extends ObjectWithIdPlus {
  objId?: string

  type?: string

  label?: string

  json?: any

}

export enum ObjectLogAction {

  /** new object */
  new = 'new',

  /** update */
  upd = 'upd',

  /** soft delete */
  sftDel = 'sftDel',

  /** hard delete */
  hrdDel = 'hrdDel'
}

export class ObjectLog extends ObjectWithId {

  branchId?: string

  /** if obj belongs to another parent object (example: objId is a payment-id & parentId is order-id) */
  parentId?: string

  objId?: string



  action?: ObjectLogAction

  type?: string

  data?: any

  date = new Date()

  usrId?: string
  resId?: string


  static update(objId?: string, data?: any): ObjectLog {
    let log = new ObjectLog()

    log.objId = objId
    log.data = data
    log.action = ObjectLogAction.upd

    return log
  }


}


export class TypeInfo extends ObjectWithId {

  branchId?: string
  name: string

  @Type(() => Date)
  lastCreated?: Date

  @Type(() => Date)
  lastUpdated?: Date

  @Type(() => Date)
  lastDeleted?: Date
}

