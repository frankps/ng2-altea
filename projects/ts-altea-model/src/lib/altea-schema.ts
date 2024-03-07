/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Exclude, Type, Transform } from "class-transformer";
import 'reflect-metadata';
import { ConnectTo, DateHelper, DbObject, IAsDbObject, ManagedObject, ObjectHelper, ObjectMgmt, ObjectReference, ObjectWithId, QueryOperator, TimeHelper } from 'ts-common'
import * as _ from "lodash";
import { PersonLine } from "./person-line";
import { DateRange, DateRangeSet, TimeBlock, TimeBlockSet, TimeSpan } from "./logic";
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as sc from 'stringcase'
import { OrderPersonMgr } from "./order-person-mgr";

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
  mo = 'mo',
  tu = 'tu',
  we = 'we',
  th = 'th',
  fr = 'fr',
  sa = 'sa',
  su = 'su'
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

export class HourMinute {
  hour = 0
  minute = 0

  static parse(time: string): HourMinute {

    const hm = new HourMinute()

    const items = time.split(':')

    hm.hour = Number(items[0])
    hm.minute = Number(items[1])

    return hm

  }
}

export class ScheduleTimeBlock {
  from = '09:00'  // format HH:mm
  to = '17:00'

  clone(): ScheduleTimeBlock {
    const block = new ScheduleTimeBlock()

    block.from = this.from
    block.to = this.to

    return block
  }

  fromParse(): HourMinute {
    return HourMinute.parse(this.from)
  }

  toParse(): HourMinute {
    return HourMinute.parse(this.to)
  }


}

export class DaySchedule {
  idx = -1
  on = true  // equals is active  
  day: DaysOfWeekShort = DaysOfWeekShort.mo

  @Type(() => ScheduleTimeBlock)
  blocks: ScheduleTimeBlock[] = []

  constructor(day: DaysOfWeekShort = DaysOfWeekShort.mo, idx = 0, on = true) {
    this.day = day
    this.idx = idx
    this.on = on
  }

  removeBlock(block: ScheduleTimeBlock) {

    if (!block)
      return

    if (this.blocks)
      _.remove(this.blocks, b => b.from == block.from && b.to == block.to)


  }
}

export class WeekSchedule {
  idx = -1

  @Type(() => DaySchedule)
  days: DaySchedule[] = []

  constructor(weekIdx: number, startAtDayIdx = 1) {

    this.idx = weekIdx
    const days = Object.values(DaysOfWeekShort);
    let dayIdx = startAtDayIdx
    let active = true

    days.forEach((day) => {   // , index

      //console.log(key);
      if (day == DaysOfWeekShort.sa)
        active = false

      const daySchedule = new DaySchedule(day, dayIdx, active)

      if (active)
        daySchedule.blocks.push(new ScheduleTimeBlock())

      this.days.push(daySchedule)
      dayIdx++

    });

  }

  /**
   * 
   * @param dayOfWeek 0=sunday ... 6=saturday
   */
  // getDay(dayOfWeek: number) {


  // }


  getDaySchedule(dayOfWeek: number): DaySchedule | undefined {

    if (!Array.isArray(this.days))
      return undefined

    const dayOfWeekEnum = this.getDaysOfWeekShort(dayOfWeek)
    return this.days.find(d => d.day == dayOfWeekEnum)

  }


  /**
   * 
   * @param dayOfWeek 0=sunday ... 6=saturday
   */
  getDaysOfWeekShort(dayOfWeek: number): DaysOfWeekShort {

    switch (dayOfWeek) {
      case 0: return DaysOfWeekShort.su
      case 1: return DaysOfWeekShort.mo
      case 2: return DaysOfWeekShort.tu
      case 3: return DaysOfWeekShort.we
      case 4: return DaysOfWeekShort.th
      case 5: return DaysOfWeekShort.fr
      case 6: return DaysOfWeekShort.sa
    }

    return DaysOfWeekShort.su
  }

}


export class User extends ObjectWithId {

  uid?: string

  prov?: string
  provId?: string
  provEmail?: string

  first?: string
  last?: string

  email?: string
  mobile?: string

  resources: Resource[]
}

export class Contact extends ObjectWithId {
  //@Type(() => Organisation)
  organisation?: Organisation;

  orgId?: string
  branchId?: string

  @Type(() => Order)
  orders?: Order[];
  name?: string;
  first?: string;
  last?: string;
  gender: Gender = Gender.unknown
  birth?: number;  // format: yyyyMMdd
  email?: string;
  emailRemind = true
  emailConf = false

  mobile?: string;
  mobileConf = false
  smsRemind = true

  phone?: string;
  language?: string;

  street?: string;
  streetNr?: string;
  postal?: string;
  city?: string;
  country?: string;

  company?: string;
  vatNum?: string;
  branches?: string[];

  depositPct?: number

  news: boolean = false
  rules: boolean = false

  active = true
  deleted = false
  deletedAt?: Date;

  subscriptions?: Subscription[]

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
  }
}

// export class ScheduleLine extends ObjectWithId {

//   schedule?: Schedule;
//   schedId?: string;
//   wk?: number;
//   dow?: number;
//   from?: Date;
//   to?: Date;
// }

export class Schedule extends ObjectWithId {

  idx = 0
  default = false

  branchId?: string;

  //@Type(() => Resource)
  resource?: Resource;
  resourceId?: string;
  name?: string;

  // @Type(() => ScheduleLine)
  // lines?: ScheduleLine[];

  @Type(() => ResourcePlanning)
  planning?: ResourcePlanning[]
  //scheduling?: Scheduling[];

  // the start of the week schedule
  start?: number;

  @Type(() => WeekSchedule)
  weeks?: WeekSchedule[] = []

  /** Includes preparation time: extra work needed before & after actual booking such as prepartions before booking or cleaning time after is included in this schedule (=> system can not go outside given timings for preparations).
   *  If true: possible preparations (defined via ProductResource, prep=true) must fall within this schedule 
   */
  prepIncl: boolean = true

  active = true;
  deleted = false;
  createdAt = new Date()
  updatedAt?: Date
  deletedAt?: Date


  isInsideSchedule(dateRange: DateRange) {

    let start = dateFns.startOfDay(dateRange.from)
    let end = dateFns.endOfDay(dateRange.to)

    let scheduleRanges = this.toDateRangeSet(start, end)

    let contains = scheduleRanges.contains(dateRange)

    return contains
  }

  /** returns the date ranges of the given dateRange that are outside schedule */
  outsideSchedule(dateRange: DateRange): DateRangeSet {

    let start = dateFns.startOfDay(dateRange.from)
    let end = dateFns.endOfDay(dateRange.to)

    let scheduleRanges = this.toDateRangeSet(start, end)

    let outside = dateRange.subtractSet(scheduleRanges)

    return outside
  }

  /** returns the date ranges of the given dateRange outside schedule */
  insideSchedule(dateRange: DateRange): DateRangeSet {

    return DateRangeSet.empty
  }

  getDaySchedule(day: Date): DaySchedule {
    const daySchedule = new DaySchedule()
    daySchedule.blocks.push(new ScheduleTimeBlock())
    return daySchedule
  }

  toDateRangeSet(from: Date | number, to: Date | number, fromLabel?: string, toLabel?: string): DateRangeSet {

    const dateRangeSet = new DateRangeSet()


    if (!this.weeks || this.weeks.length == 0)
      return dateRangeSet

    let fromDate, toDate: Date

    if (DateHelper.isDate(from))
      fromDate = from as Date
    else
      fromDate = DateHelper.parse(from)

    if (DateHelper.isDate(to))
      toDate = to as Date
    else
      toDate = DateHelper.parse(to)

    const days = dateFns.eachDayOfInterval({ start: fromDate, end: toDate })

    const weekSchedule = this.weeks[0]
    const toDateMillis = toDate.getTime()

    for (const dayDate of days) {

      if (dayDate.getTime() == toDateMillis) // if toDate is start of new day, then we're not interested in that day
        break

      const dayOfWeek = dayDate.getDay()
      const daySchedule = weekSchedule.getDaySchedule(dayOfWeek)

      if (daySchedule && Array.isArray(daySchedule.blocks)) {

        for (const block of daySchedule.blocks) {

          const from: HourMinute = block.fromParse()
          let fromDate = dateFns.addHours(dayDate, from.hour)
          fromDate = dateFns.addMinutes(fromDate, from.minute)

          const to: HourMinute = block.toParse()
          let toDate = dateFns.addHours(dayDate, to.hour)
          toDate = dateFns.addMinutes(toDate, to.minute)

          dateRangeSet.addRangeByDates(fromDate, toDate, fromLabel, toLabel)

        }


      }

      // daySchedule?.blocks

    }





    return dateRangeSet

  }
}


export class Scheduling extends ObjectWithId {

  idx = 0
  schedule?: Schedule;
  schedId?: string;
  resource?: Resource;
  resourceId?: string;
  type = SchedulingType.active

  //  @Type(() => Date)
  start?: number;

  // @Type(() => Date)
  end?: number;
  prio = 0
  available = true
  default = true

  get startUtc() {
    const start = DateHelper.parse(this.start)
    return TimeHelper.hhmmUTC(start)
  }

  set startUtc(val: string) {
    const start = TimeHelper.hhmmUTCToDate(val)
    this.start = DateHelper.yyyyMMdd000000(start)

  }

  get startDate() {
    console.warn(this.start)
    return DateHelper.parse(this.start)
  }

  get endDate() {
    return DateHelper.parse(this.end)
  }
}

export enum ProductRuleType {
  startAt = 'startAt',
  prePost = 'prePost'
}

/*
Product rules:
1. startAt: start Wellness at certain times for certain schedules (= operational modes on branch level)
2. prePost: adapt pre & post times based on certain condition (ex nr of persons > 5)
*/
export class ProductRule {
  type?: ProductRuleType
  idx = 0

  /** if rule only applies for certain schedules (typically branch schedules) */
  scheduleIds?: ObjectReference[]

  startAt?: string[]  // format 09:30, 11:00

  optionIds?: ObjectReference[]

  operator?: QueryOperator

  value?: number

  preTime?: number
  postTime?: number
}

export enum PlanningMode {
  none = 'none',
  continuous = 'continuous',
  block = 'block'
}

export class PlanningBlockSeries {
  start = "09:00"

  /** default duration of 1 block */
  dur = 60

  /** absolute minimum time for 1 block */
  min = 60

  /** time between 2 blocks */
  post = 15

  /** number of blocks in series */
  count = 1

  /** deviations from series allowed */
  dev = true

  scheduleIds: string[] = []

  /** equals duration of default space + post (time between 2 blocks) */
  durationEmptyBlock() {
    return this.dur + this.post
  }


  /** apply this series definition within given date range (inRange) */
  makeBlocks(inRange: DateRange): DateRangeSet {

    const start = dateFns.parse(this.start, 'HH:mm', inRange.from)

    const result = DateRangeSet.empty

    let loop = start
    let count = 0

    while (loop < inRange.to && (!this.count || count < this.count)) {

      const end = dateFns.addMinutes(loop, this.dur)

      if (loop >= inRange.from && end <= inRange.to) {
        const range = new DateRange(loop, end)
        result.addRange(range)
      }

      loop = dateFns.addMinutes(end, this.post)
      count++
    }


    return result
  }

}




export class Product extends ObjectWithId {
  // new
  customers?: number
  staff?: number
  gender?: Gender
  online?: OnlineMode

  organisation?: Organisation | ConnectTo;
  orgId?: string;

  branch?: Branch | ConnectTo
  branchId?: string

  category?: ProductCategory | ConnectTo;
  catId?: string;

  //  isCategory = false

  @Type(() => Price)
  prices?: Price[]

  @Type(() => ProductOption)
  options?: ProductOption[]

  @Type(() => ProductResource)
  resources?: ProductResource[]

  lines?: OrderLine[]

  //  bundle: boolean = false

  @Type(() => ProductItem)
  items?: ProductItem[]

  @Type(() => ProductItem)
  usedIn?: ProductItem[]
  idx?: number;
  name?: string;
  short?: string;

  type?: ProductType = ProductType.prod

  /** Product sub type */
  sub?: ProductSubType = ProductSubType.basic

  descr?: string;
  showPrice = true
  showDuration = true
  showPos = true
  public?: boolean;
  planMode: PlanningMode = PlanningMode.continuous

  /** specification of blocks if planMode==block */
  @Type(() => PlanningBlockSeries)
  plan?: PlanningBlockSeries[]

  planOrder?: number;

  color?: string;

  @Type(() => ProductRule)
  rules?: ProductRule[]

  duration = 0

  hasPre = false   // has preparation time
  preTime = 15     // preparation time (before actual treatment)
  preMaxGap = 0    // max gap between preparation (preTime) and actual treatment

  hasPost = false  // has cleanup time
  postTime = 15    // cleanup time (after actual treatment)
  postMaxGap = 0   // max gap between actual treatment and cleanup

  stock = 0
  minStock = 0
  //advance = 0
  vatPct = 0
  branches?: string[];

  depositPct = 0

  personSelect = true  // if order is for multiple persons, then customer can specify for each orderLine the person
  staffSelect = true  // customer can specify which staffmember 

  active?: boolean;
  deleted?: boolean;
  deletedAt?: Date;

  //@TransformToNumber()
  @Type(() => Number)
  salesPrice = 0

  advPricing = false


  getIcon(): string {

    if (this.isCategory())
      return ProductTypeIcons.cat
    else if (this.sub == ProductSubType.basic)
      return ProductTypeIcons[this.type]
    else
      return ProductTypeIcons[`${this.type}_${this.sub}`]
  }

  isCategory() {
    return this.sub == ProductSubType.cat
  }

  isBundle() {
    return this.sub == ProductSubType.bundle
  }

  isSubscription() {
    return this.sub == ProductSubType.subs
  }

  getOnlineIcon(): string {

    if (this.online)
      return ProductOnlineIcons[this.online]

    return ''
  }

  hasOptions() {
    return (this.options && this.options.length > 0)
  }

  hasItems() {
    return (this.items && this.items.length > 0)
  }

  hasResources() {
    return (this.resources && this.resources.length > 0)
  }

  hasRules() {
    return (this.rules && this.rules.length > 0)
  }

  getResourcesForSchedule(scheduleId: string): ProductResource[] {

    if (!this.resources || this.resources.length == 0)
      return []

    const prodResArray = this.resources.filter(r => (r.scheduleIds && r.scheduleIds.indexOf(scheduleId) >= 0) || !r.scheduleIds || r.scheduleIds.length == 0)

    return prodResArray
  }

  getBlockSeries(scheduleId: string): PlanningBlockSeries[] {

    let series = this.plan?.filter(blockSeries => Array.isArray(blockSeries.scheduleIds) && blockSeries.scheduleIds.indexOf(scheduleId) >= 0)

    if (!Array.isArray(series) || series.length == 0)
      series = this.plan?.filter(blockSeries => !Array.isArray(blockSeries.scheduleIds) || blockSeries.scheduleIds.length == 0)

    return series
  }

  getOptionValues(optionId: string): ProductOptionValue[] {

    if (!this.hasOptions())
      return []

    const option = this.options.find(o => o.id == optionId)

    if (!option || !option.values)
      return []

    return option.values


  }


}

export class ProductItemOptionValue {
  id?: string;
  name?: string;
  //value?: any

  constructor(prodOptionValue?: ProductOptionValue) {

    if (!prodOptionValue)
      return

    this.id = prodOptionValue.id
    this.name = prodOptionValue.name
    // this.value = prodOptionValue.value
  }
}

export class ProductItemOption {
  id?: string;
  name?: string;

  @Type(() => ProductItemOptionValue)
  values?: ProductItemOptionValue[] = []

  constructor(productOption?: ProductOption) {

    if (!productOption)
      return

    this.id = productOption.id
    this.name = productOption.name

  }

  hasValue(): boolean {

    if (Array.isArray(this.values) && this.values.length > 0) {
      return true
    }
    //else {

    //   if (this.values?.value && this.values?.value != 0)
    //     return true


    // }

    return false
  }
}

export class ProductItem extends ObjectWithId {
  parentId?: string;
  parent?: Product;
  productId?: string;
  product?: Product;
  idx?: number = 0
  name?: string;
  qty?: number = 1

  @Type(() => ProductItemOption)
  options?: ProductItemOption[] = []

  get optionsWithValues() {
    if (!this.options)
      return []

    return this.options?.filter(o => o.hasValue())
  }

  getOption(productOption: ProductOption, createIfNotExisting = true): ProductItemOption {

    if (!this.options)
      this.options = []

    let productItemOption = this.options.find(o => o.id == productOption.id)

    if (productItemOption?.name == 'Duur wellness') {
      console.error(this.options)
      console.error(productItemOption)
    }

    if (!productItemOption) {  // && createIfNotExisting)
      productItemOption = new ProductItemOption(productOption)
      productItemOption.id = productOption.id
      productItemOption.name = productOption.name
      productItemOption.values = []


      if (productOption.values && productOption.values.length > 0) {

        const defaultValues = productOption.values.filter(v => v.default === true).map(v => new ProductItemOptionValue(v))

        if (defaultValues && defaultValues.length > 0) {

          if (productOption.multiSelect)
            productItemOption.values = defaultValues
          else
            productItemOption.values = [defaultValues[0]]

        }

      }


      // if (productOption.multiSelect)


      // if (productOption.values && productOption.values.length > 0)
      //   option.values = productOption.values[0]


      this.options.push(productItemOption)
    }

    return productItemOption
  }
}

/* export enum OptionPriceMode {
  abs = 'abs', // absolute price
  pct = 'pct'  // percentage price change
} */

/**
 * Used in price.options
 */
export class OptionPrice {
  optionId?: string

  name?: string

  /** this value (price or percentage) is valid for all option values */
  allValues: boolean = true

  values = []  // array of {id, name} objects

  /** value is percentage, otherwise it's an absolute price */
  isPct: boolean = false

  //mode: OptionPriceMode = OptionPriceMode.abs

  /** The price change */
  @Type(() => Number)
  value?: number = 0

}

export enum PriceMode {
  same = 'same', // same base price
  abs = 'abs',  // absolute price change
  pct = 'pct'   // percentage price change
}

/*
isPromo Boolean @default(false) // not every price is a promotion, can also be more expensive price 
title   String?
descr   String?
*/

export class Price extends ObjectWithId {

  productId?: string;
  product?: Product;
  /*   productOptionValueId?: string;
    productOptionValue?: ProductOptionValue; */
  type?: PriceType = PriceType.sales

  isPromo = false
  title?: string
  descr?: string

  mode: PriceMode = PriceMode.pct

  @Type(() => Number)
  value?: number = 0

  //  @Type(() => Date)
  start?: number | null;

  //  @Type(() => Date)
  end?: number | null;

  qty?: number = 1

  isQty = false
  isDay = false
  days: boolean[] = []

  isTime = false
  from?: string
  to?: string

  isExtraQty = false
  extraQty: number = 0
  productItemId?: string

  hasOptions = false  // true if this price also has option specific price changes
  options: OptionPrice[] = []



  idx = 0

  constructor(productId?: string, title?: string) {
    super()


    this.productId = productId
    this.title = title

    this.initDays()
    // this.start = new Date()
    // this.end = new Date()
  }

  initDays() {

    if (!this.days)
      this.days = []

    for (let i = this.days.length; i <= 6; i++) {
      this.days.push(false)
    }

  }

  @Exclude()
  _startDate: Date | null = null

  @Exclude()
  _endDate: Date | null = null


  get startDate(): Date | null {

    if (!this.start)
      return null

    if (this._startDate && DateHelper.yyyyMMddhhmmss(this._startDate) === this.start)
      return this._startDate

    this._startDate = DateHelper.parse(this.start)
    return this._startDate

  }

  set sameBasePrice(value: boolean) {
    this.mode = value ? PriceMode.same : PriceMode.pct
  }

  get sameBasePrice() {
    return this.mode == PriceMode.same
  }

  set isAbsolute(value: boolean) {
    this.mode = value ? PriceMode.abs : PriceMode.same
  }

  get isAbsolute() {
    return this.mode == PriceMode.abs
  }

  set isPercentage(value: boolean) {
    this.mode = value ? PriceMode.pct : PriceMode.same
  }

  get isPercentage() {
    return this.mode == PriceMode.pct
  }


  set startDate(value: Date | null) {

    if (value) {
      this.start = DateHelper.yyyyMMdd(value) * 1000000  // * 1000000 because we don't care about hhmmss
      this._startDate = null
    }
    else
      this.start = null

  }


  get endDate(): Date | null {

    if (!this.end)
      return null

    if (this._endDate && DateHelper.yyyyMMddhhmmss(this._endDate) === this.end)
      return this._endDate

    this._endDate = DateHelper.parse(this.end)
    return this._endDate

  }


  set endDate(value: Date | null) {

    if (value) {
      this.end = DateHelper.yyyyMMdd(value) * 1000000
      this._endDate = null
    }
    else
      this.end = null

  }




}

export class Organisation extends ObjectWithId {

  idx = 0
  name?: string;
  short?: string;
  unique?: string;
  email?: string;
  url?: string;
  mobile?: string;
  phone?: string;
  category?: string;
  descr?: string;
  multiBranch = false
  agreeTerms = false
  optInNews = false

  //@Type(() => Branch)
  branches?: Branch[];

  //@Type(() => Resource)
  resources?: Resource[];

  // @Type(() => ProductCategory)
  // categories?: ProductCategory[];

  //@Type(() => Product)
  products?: Product[];

  //@Type(() => Contact)
  contacts?: Contact[];

  //@Type(() => Order)
  orders?: Order[];

  active = true;
  deleted = false;
  createdAt = new Date()
  updatedAt?: Date
  deletedAt?: Date

  asDbObject(): DbObject<Organisation> {
    return new DbObject<Organisation>('organisation', Organisation, this)
  }
}


/** DepositTerms define how much time a customer has to pay for a reservation (pt=payment term) 
 * based on how long the booking was made upfront (bt=before time)   */
export class DepositTerm {

  /** before time: time between reservation made and effective date of reservation */
  bt: number = 0

  /** before time unit: (d)ays, (h)ours, (m)inutes */
  btu: string = 'd'

  /** payment term: the time a customer has to pay for his reservation */
  pt: number = 0

  /** payment term unit: (d)ays, (h)ours, (m)inutes */
  ptu: string = 'h'
}

export enum MsgType {
  unknown = 'unknown',
  sms = 'sms',
  email = 'email'
}

/*
model Message {
  id String @id(map: "newtable_pk") @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  type String?  // email, sms

  from String?
  to String[]
  cc String[]
  bcc String[]

  subject String?
  body String?
}
*/

export class IEmail {
  from?: string
  to: string[]
  cc: string[]
  subject?: string
  body?: string
}

export class Message extends ObjectWithId implements IEmail {

  branchId?: string
  orderId?: string

  type: MsgType = MsgType.email

  from?: string
  to: string[] = []
  cc: string[] = []
  bcc: string[] = []

  subject?: string
  body?: string

}

export class ReminderConfig {
  type: MsgType = MsgType.email

  dur: number = 1

  unit: TimeUnit = TimeUnit.days

  seconds(): number {
    return TimeUnitHelper.numberOfSeconds(this.unit) * this.dur
  }

  toReminder(appointmentDate: Date): Reminder {
    const seconds = this.seconds()
    const remindeOn = dateFns.addSeconds(appointmentDate, -seconds)

    const reminder = new Reminder(remindeOn, this.type)
    return reminder
  }
}

export class Reminder {

  @Exclude()
  date: Date

  on: number

  type: MsgType

  constructor(date: Date, type: MsgType = MsgType.email) {

    this.date = date
    this.on = DateHelper.yyyyMMddhhmmss(date)
    this.type = type

  }
}


export class GiftConfigMethods {
  email = true
  postal = false
  pos = true
  app = false
}

export class GiftTypes {
  // an amount can be gifted
  amount = true

  // specific services can be gifted
  svc = true

  // specific products can be gifted
  prod = false
}

export class GiftExpiration {
  /** gift expiration is enabled */
  on = true

  /** how long is gift voucher valid */
  after: number = 12

  unit = TimeUnit.months
}

export class GiftPriceSetting {

  /** If true, possible new prices will be charged to customer (=> old gift voucher might not be enough). 
   * If false, customer can always use gift voucher for this product  */
  new = false

  /** if new=true, new prices will only be charged after time period (in units)   */
  newAfter: number = 12
  unit = TimeUnit.months

  /** if branch.gift.methods.postal = true, cost that will be charged to send gift via post. */
  postal: number = 0

}

export class GiftVatPct {

  on = false

  pct = 0

  descr = ''

}

export class GiftInvoicing {
  /** gift invoicing is enabled: customer can request invoice for gift */
  on = false

  /** when customer gifts an amount (no specific product) and requests an invoice, then he should select a VAT% (category). 
   * Here we specify which percentages can be selected and give them a name.  */
  vatPcts: GiftVatPct[] = []
}



export class GiftConfig {

  @Type(() => GiftConfigMethods)
  methods: GiftConfigMethods = new GiftConfigMethods()

  @Type(() => GiftTypes)
  types: GiftTypes = new GiftTypes()

  @Type(() => GiftExpiration)
  expire: GiftExpiration = new GiftExpiration()

  @Type(() => GiftPriceSetting)
  price: GiftPriceSetting = new GiftPriceSetting()

  @Type(() => GiftInvoicing)
  invoice: GiftInvoicing = new GiftInvoicing()
}

export class Branch extends ObjectWithId {

  orders?: Order[];
  idx = 0

  //@Type(() => Organisation)
  organisation?: Organisation;

  orgId?: string;
  name?: string;
  unique?: string;
  short?: string;
  descr?: string;
  street?: string;
  streetNr?: string;
  postal?: string;
  country?: string;

  phone?: string
  mobile?: string
  email?: string

  /** currency */
  cur?: string = 'EUR'

  city?: string;
  language?: string;
  emailFrom?: string;
  emailBcc?: string;

  vatIncl = true
  vatPct = 0
  vatPcts?: number[];
  vatNr?: string


  smsOn = false

  /** default deposit percentage, can be overruled on product & contact level */
  depositPct?: number

  depositTerms?: DepositTerm[]

  reminders?: ReminderConfig[]

  /** this branch uses the gift functionality */
  giftOn = false

  @Type(() => GiftConfig)
  gift?: GiftConfig

  active = true;
  deleted = false;
  createdAt = new Date()
  updatedAt?: Date
  deletedAt?: Date

  get sameDayTerm(): number { return this.getDepositTerm(0) }
  set sameDayTerm(value: number) { this.setDepositTerm(0, value) }

  get nextDayTerm(): number { return this.getDepositTerm(1) }
  set nextDayTerm(value: number) { this.setDepositTerm(1, value) }

  get nextWeekTerm(): number { return this.getDepositTerm(7) }
  set nextWeekTerm(value: number) { this.setDepositTerm(7, value) }

  get nextMonthTerm(): number { return this.getDepositTerm(30) }
  set nextMonthTerm(value: number) { this.setDepositTerm(30, value) }


  // 
  //nextDayTerm: number = 5

  hasReminders() {
    return (Array.isArray(this.reminders) && this.reminders.length > 0)
  }

  getDepositTerm(beforeTime: number, beforeUnit: string = 'd') {
    if (!Array.isArray(this?.depositTerms))
      return null

    const term = this?.depositTerms.find(dt => dt.bt == beforeTime && dt.btu == beforeUnit)

    if (!term)
      return null
    else
      return term.pt
  }

  setDepositTerm(beforeTime: number, depositTerm: number, beforeUnit: string = 'd') {

    if (!Array.isArray(this?.depositTerms))
      this.depositTerms = []

    if (!depositTerm) {
      _.remove(this?.depositTerms, t => t.bt == beforeTime && t.btu == beforeUnit)
      console.warn(this?.depositTerms)
      return

    }

    let term = this?.depositTerms.find(dt => dt.bt == beforeTime && dt.btu == beforeUnit)

    if (term) {
      term.pt = depositTerm
    }
    else {


      term = new DepositTerm()

      term.bt = beforeTime
      term.btu = beforeUnit
      term.pt = depositTerm

      this.depositTerms.push(term)
    }

    console.error(term)
    console.warn(this?.depositTerms)


  }




}


export enum ResourceType {
  human = 'human',

  // do NOT use anymore, use location instead!
  room = 'room',
  location = 'location',
  device = 'device',
  //  group = 'group',
}

export enum ResourceTypeIcons {
  human = 'fa-duotone fa-person-dress',
  room = 'fa-duotone fa-house',
  device = 'fa-duotone fa-computer-classic',  // fa-tablet-rugged
  group = 'fa-duotone fa-user-group',
}

export enum ResourceTypeCircleIcons {
  human = 'fa-solid fa-circle-user',
  room = 'fa-duotone fa-house',
  device = 'fa-duotone fa-tablet-rugged',
  group = 'fa-duotone fa-user-group',
}

export class Resource extends ObjectWithId {

  @Type(() => ResourceLink)
  groups?: ResourceLink[];

  @Type(() => ResourceLink)
  children?: ResourceLink[];

  @Type(() => ProductResource)
  products?: ProductResource[];

  @Type(() => Scheduling)
  scheduling?: Scheduling[];

  @Type(() => Schedule)
  schedules?: Schedule[];

  organisation?: Organisation | ConnectTo;
  orgId?: string;

  branch?: Branch | ConnectTo;
  branchId?: string;

  name?: string;
  type?: ResourceType;

  short?: string;
  descr?: string;
  color?: string;
  qty = 1


  start?: number | null;


  end?: number | null;

  label?: string;
  prio?: number;
  isGroup = false
  //isRole?: boolean;
  tel?: string;
  email?: string;

  /** human resources only: staff member can be selected online by customers as prefered */
  online?: boolean;

  /** human resources only: can be linked to an actual user (that can log-in) */
  userId?: string
  user?: User

  branches?: string[];
  active?: boolean;
  deleted?: boolean;
  deletedAt?: Date;

  /** Most resources use the schedule (opening hours) of the branch, but a custom schedule can be specified per resource  */
  customSchedule = false

  @Exclude()
  _startDate: Date | null = null

  @Exclude()
  _endDate: Date | null = null


  shortOrName(): string {
    return (this.short) ? this.short : this.name!
  }

  canChangeQty(): boolean {
    return (this.type == ResourceType.device || this.type == ResourceType.room)
  }


  getChildResources(): Resource[] {

    if (!Array.isArray(this.children))
      return []


    const childResources = this.children.filter(resourceLink => resourceLink?.child).map(resourceLink => resourceLink.child!)

    return childResources
    /*
    const childResources: Resource[] = []

    if (!Array.isArray(this.children))
      return childResources

    for (const resourceLink of this.children!) {

      if (resourceLink.child)
        childResources.push(resourceLink.child)
    }

    return childResources
    */
  }

  get startDate(): Date | null {

    if (!this.start)
      return null

    if (this._startDate && DateHelper.yyyyMMddhhmmss(this._startDate) === this.start)
      return this._startDate

    this._startDate = DateHelper.parse(this.start)
    return this._startDate


  }


  set startDate(value: Date | null) {

    if (value) {
      this.start = DateHelper.yyyyMMdd(value) * 1000000  // * 1000000 because we don't care about hhmmss
      this._startDate = null
    }
    else
      this.start = null

  }



  get endDate(): Date | null {

    if (!this.end)
      return null

    if (this._endDate && DateHelper.yyyyMMddhhmmss(this._endDate) === this.end)
      return this._endDate

    this._endDate = DateHelper.parse(this.end)
    return this._endDate

  }


  set endDate(value: Date | null) {

    if (value) {
      this.end = DateHelper.yyyyMMdd(value) * 1000000
      this._endDate = null
    }
    else
      this.end = null

  }


  get hasStart(): boolean {
    return (this.start !== undefined && this.start !== null)
  }

  set hasStart(value: boolean) {

    if (value) {
      const now = new Date()
      this.start = DateHelper.yyyyMMddhhmmss(now)
      //  this.start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(),6))
    }
    else
      this.start = null

  }


  get hasEnd(): boolean {
    return (this.end !== undefined && this.end !== null)
  }

  set hasEnd(value: boolean) {

    if (value) {
      const now = new Date()
      this.end = DateHelper.yyyyMMddhhmmss(now)
      // this.end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(),21))
    }
    else
      this.end = null

  }

}

export class ResourceLink extends ManagedObject {

  @Exclude()
  get id(): string {
    return `${this.groupId}_${this.childId}`
  }

  groupId?: string;
  childId?: string;

  @Type(() => Resource)
  group?: Resource;

  @Type(() => Resource)
  child?: Resource;

  /** preference */
  pref = 0


}


export interface ProductCategory {
  id: string;
  organisation: Organisation;
  orgId: string;
  products?: Product[];
  idx: number;
  name: string;
  abbr?: string;
  descr?: string;
  active: boolean;
  deleted: boolean;
  deletedAt?: Date;
}


export class ProductResource extends ObjectWithId {

  constructor() {
    super()
  }
  productId?: string;

  @Type(() => Product)
  product?: Product;
  resourceId?: string;

  @Type(() => Resource)
  resource?: Resource;
  idx?: number;
  durationMode: DurationMode = DurationMode.custom
  reference: DurationReference = DurationReference.start
  offset = 0
  duration = 0

  /** if resource is group => how many resources from group do we need to reserve */
  groupQty = 1

  /** group allocation = instead of allocating a specific resource (person,...), we allocate on resource group => make sure at least 1 resource stays available */
  groupAlloc = false

  /** Label to be shown in calendar */
  label?: string

  /** if rule only applies for certain schedules (typically branch schedules) */
  scheduleIds?: string[] = []

  /** is preperation time (before or after actual treatment) */
  prep: boolean = false

  /** the preparation time after a booking/treatment can overlap with prep time before next booking (the max of before/after will be used) */
  prepOverlap: boolean = false


}


/**
 *  A formula term 
 */
export class FormulaTerm {
  factor = 1

  value = true

  optionId?: string
}

export class ProductOption extends ObjectWithId {
  productId?: string;
  product?: Product;

  @Type(() => ProductOptionValue)
  values?: ProductOptionValue[];
  idx = 0
  name?: string;
  descr?: string;
  public = true
  required = true
  multiSelect = false

  hasDuration = false
  hasPrice = false

  hasValue = false
  // hasFactor = false
  factorOptionId?: string

  hasFormula = false

  /** Sum of 1 or more formula terms */
  @Type(() => FormulaTerm)
  formula: FormulaTerm[] = []

  /** private option: customers can't select, only internally */
  pvt = false

  /** the property providing the value*/
  //factorOptionProp?: string

  active = true
  deleted = false
  deletedAt?: Date;


  hasValues(): boolean {
    return (Array.isArray(this.values) && this.values.length > 0)
  }

  getDefaultValues(): ProductOptionValue[] | undefined {
    if (!this.values || this.values.length == 0)
      return undefined

    return this.values.filter(v => v.default)
  }

  getValues(ids: String[]): ProductOptionValue[] {

    if (!Array.isArray(this.values) || !Array.isArray(ids))
      return []

    const values = this.values.filter(v => ids.indexOf(v.id) >= 0)

    return values
  }


  toProductItemOptionValues(): ProductItemOptionValue[] {

    if (!this.values)
      return []

    return this.values.map(v => new ProductItemOptionValue(v))
  }


}

export class ProductOptionValue extends ObjectWithId {

  optionId?: string;
  option?: ProductOption;
  prices?: Price[];
  idx = 0
  name?: string;
  descr?: string;

  @Type(() => Number)
  duration = 0

  // @TransformToNumber()
  @Type(() => Number)
  price = 0

  @Type(() => Number)
  value = 0

  /*
  @Type(() => Number)
  factor = 0 */

  /** private option value: customers can't select specific value, only internally */
  pvt = false

  default = false
  active = true
  deleted = false
  deletedAt?: Date;


  get namePrice() {
    return this.name

    if (!this.price || this.price == 0)
      return this.name
    else
      return `${this.name} (+${this.price})`
  }
}

export enum InvoiceState {
  toInvoice = 'toInvoice',
  invoiced = 'invoiced',
  onHold = 'onHold'
}

export class Invoice extends ObjectWithId {

  orders?: Order[];

  state: InvoiceState = InvoiceState.toInvoice

  num?: string;

  company?: string
  vat?: string
  country?: string = 'BEL'
  address?: string

  email?: string

  date?: Date

  /** alternative message for on invoice */
  alter?: string

  active = true;
  deleted = false;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}


export class Subscription extends ObjectWithId {

  orgId?: string;
  branchId?: string;

  @Type(() => Contact)
  contact?: Contact;
  contactId?: string;

  // @Type(() => Order)
  order?: Order;
  orderId?: string;
  name?: string;
  remark?: string;

  @Type(() => Product)
  subscriptionProduct?: Product;


  subscriptionProductId?: string;

  @Type(() => Product)
  unitProduct?: Product;
  unitProductId?: string;
  firstUsedOn?: Date;
  expiresOn?: Date;
  totalQty = 0;
  usedQty = 0;
  active = true;
  deleted = false;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class OrderPerson extends ObjectWithId {
  name?: string

  constructor(id: string, name: string) {
    super()
    this.id = id
    this.name = name
  }

  clone(): OrderPerson {
    const clone = new OrderPerson(this.id!, this.name!)

    return clone
  }

  //   static create(name: string): OrderPerson {

  //     const person: OrderPerson = new OrderPerson();

  //     person.id = person.id.substr(0, 4);
  //     person.name = name;
  //     return person;
  // }
}

/*
enum OrderState {

  creation
  waitDeposit
  confirmed
  
  canceled
  noDepositCancel
  inTimeCancel
  lateCancel

  arrived
  noShow
  finished

  inProgress
  timedOut
}
*/


// export const orderTemplates = ['wait-deposit', 'confirmation', 'no-deposit-cancel', 'in-time-cancel', 'late-cancel', 'reminder', 'no-show', 'satisfaction']


export enum OrderState {

  creation = 'creation',
  waitDeposit = 'waitDeposit',
  confirmed = 'confirmed',

  canceled = 'canceled',
  noDepositCancel = 'noDepositCancel',
  inTimeCancel = 'inTimeCancel',
  lateCancel = 'lateCancel',

  arrived = 'arrived',
  noShow = 'noShow',
  finished = 'finished',

  inProgress = 'inProgress',
  //  confirmed = 'confirmed',
  //  canceled = 'canceled',
  timedOut = 'timedOut'
}

export class VatLine {

  constructor(public pct: number, public excl: number, public incl: number) {

  }

}

/** Resource preferences */
export class ResourcePreferences {
  /** list of preferred human resource ids */
  humIds: string[] = []

  /** list of preferred location resource ids */
  locIds: string[] = []
}

export class Order extends ObjectWithId implements IAsDbObject<Order> {

  static jsonProps = ['vatLines', 'persons', 'info']

  organisation?: Organisation;
  orgId?: string;

  branch?: Branch;
  branchId?: string;

  @Type(() => Contact)
  contact?: Contact;
  contactId?: string;

  @Type(() => Invoice)
  invoice?: Invoice;
  invoiceId?: string;

  @Type(() => OrderLine)
  lines?: OrderLine[] = []

  @Type(() => Payment)
  payments?: Payment[] = []

  @Type(() => Subscription)
  subscriptions?: Subscription[];
  // satisfaction?: Satisfaction;

  @Type(() => ResourcePlanning)
  planning?: ResourcePlanning[]

  appointment = false;

  start?: number; // format: yyyyMMddHHmmss


  end?: number; // format: yyyyMMddHHmmss
  descr?: string;
  type = OrderType.sales

  @Type(() => Number)
  excl = 0;

  @Type(() => Number)
  vat = 0;

  @Type(() => VatLine)
  vatLines?: VatLine[] = []

  @Type(() => Number)
  incl = 0;

  @Type(() => Number)
  deposit = 0;

  /** number of minutes within deposit needs to be paid */
  depositMins?: number = 60

  depositBy?: number  // format: yyyyMMddHHmmss

  @Type(() => Number)
  paid = 0;

  nrOfPersons = 1;

  @Type(() => OrderPerson)
  persons?: OrderPerson[] = []

  toInvoice = false;
  invoiced = false;
  invoiceNum?: string;

  state: OrderState = OrderState.creation

  /** extra info about order: to reduce joins */
  info?: string = ''

  /** public note => customer can see */
  pubNote?: string = undefined

  /** private note => only visible internally  */
  privNote?: string = undefined

  /** unique public code visible to customer */
  code?: string = undefined

  gift = false;
  giftCode?: string;

  /** messaging (email,sms) to customer enabled */
  msg = true

  remindOn?: number  // format: yyyyMMddHHmmss

  remindLog?: Reminder[]

  active = true;
  deleted = false;

  @Type(() => Date)
  createdAt = new Date();
  updatedAt?: Date;
  deletedAt?: Date;

  /** resource preferences for order */
  @Type(() => ResourcePreferences)
  resPrefs?: ResourcePreferences

  constructor(markAsNew = false) {
    super()

    if (markAsNew)
      this.m.n = true
    //delete this.id //= undefined
  }

  get startDate(): Date | undefined {
    if (!this.start)
      return undefined

    return DateHelper.parse(this.start)
  }

  depositByDate(): Date {
    return dateFns.addMinutes(this.createdAt, this.depositMins)
  }

  setDepositBy() {
    this.depositBy = DateHelper.yyyyMMddhhmmss(this.depositByDate())
  }

  asDbObject(): DbObject<Order> {
    return new DbObject<Order>('order', Order, this)
  }

  clone(): Order {

    return ObjectHelper.clone(this, Order)
  }

  isEmpty(): boolean {
    return !this.hasLines()
  }

  hasPersons(): boolean {
    return (Array.isArray(this.persons) && this.persons.length > 0)
  }

  hasLines(): boolean {
    return (Array.isArray(this.lines) && this.lines.length > 0)
  }

  hasPlanningLines(): boolean {
    if (!this.hasLines())
      return false

    return this.lines.findIndex(l => l.product.type == ProductType.svc) >= 0
  }

  nrOfLines(): number {
    if (!Array.isArray(this.lines))
      return 0

    return this.lines.length

  }

  getLine(orderLineId: string): OrderLine | undefined {

    return this.lines?.find(l => l.id == orderLineId)
  }

  addPayment(payment: Payment) {

    if (!payment)
      return

    if (!this.payments)
      this.payments = []

    this.payments.push(payment)
    payment.markAsNew()

    this.makePayTotals()
  }

  hasPayments(): boolean {
    return (Array.isArray(this.payments) && this.payments.length > 0)
  }

  makePayTotals() {



    let totalPaid = 0

    console.warn(this.payments)

    if (Array.isArray(this.payments))
      totalPaid = _.sumBy(this.payments, 'amount');

    console.error(totalPaid)

    if (totalPaid != this.paid) {
      this.paid = totalPaid
      this.markAsUpdated('paid')
    }

  }

  addLine(orderLine: OrderLine) {

    if (!this.lines)
      this.lines = []

    orderLine.setUnitPrice()
    this.lines.push(orderLine)

    orderLine.markAsNew()

    this.calculateAll()

  }

  calculateAll() {
    this.makeLineTotals()
    this.calculateVat()
  }




  hasVatLines(): boolean {
    return (Array.isArray(this.vatLines) && this.vatLines.length > 0)
  }

  calculateVat() {

    if (!this.hasLines())
      this.vatLines = []

    const vatMap = new Map<number, VatLine>()

    for (let orderLine of this.lines) {

      if (!orderLine || !orderLine.vatPct || orderLine.vatPct === 0)
        continue

      let vatLine: VatLine

      if (vatMap.has(orderLine.vatPct))
        vatLine = vatMap.get(orderLine.vatPct)
      else {
        vatLine = new VatLine(orderLine.vatPct, 0, 0)
        vatMap.set(orderLine.vatPct, vatLine)
      }

      vatLine.excl += orderLine.excl
      vatLine.incl += orderLine.incl
    }

    let calculatedVatLines = Array.from(vatMap.values())
    calculatedVatLines = _.sortBy<VatLine>(calculatedVatLines, 'pct')

    if (!this.vatLinesSame(this.vatLines, calculatedVatLines)) {
      this.vatLines = calculatedVatLines
      this.markAsUpdated('vatLines')
    }


  }

  vatLinesSame(vatLinesA: VatLine[], vatLinesB: VatLine[]) {

    const lengthA = !Array.isArray(vatLinesA) ? 0 : vatLinesA.length
    const lengthB = !Array.isArray(vatLinesB) ? 0 : vatLinesB.length

    if (lengthA != lengthB)
      return false

    return _.isEqual(vatLinesA, vatLinesB)
  }


  makeLineTotals(): number {

    if (!this.lines)
      return 0

    let incl = 0

    for (const line of this.lines) {

      const lineIncl = line.qty * line.unit

      if (lineIncl != line.incl) {
        line.incl = lineIncl
        line.markAsUpdated('incl')
      }

      incl += line.incl
    }

    if (incl != this.incl) {
      this.incl = incl
      this.markAsUpdated('incl')
    }

    return this.incl
  }

  deletePayment(payment: Payment): boolean {

    if (!this.payments || !payment)
      return false

    const removed = _.remove(this.payments, l => l.id == payment.id)

    if (Array.isArray(removed) && removed.length > 0 && !payment.m.n)  // orderLine.m.n = it was a new line not yet saved in backend
    {
      this.markAsRemoved('payments', payment.id)
    }

    this.makePayTotals()

    return (Array.isArray(removed) && removed.length > 0)
  }

  deleteLine(orderLine: OrderLine): boolean {

    if (!this.lines || !orderLine)
      return false

    const removed = _.remove(this.lines, l => l.id == orderLine.id)

    if (Array.isArray(removed) && removed.length > 0 && !orderLine.m.n)  // orderLine.m.n = it was a new line not yet saved in backend
      this.markAsRemoved('lines', orderLine.id)

    this.calculateAll()

    return (Array.isArray(removed) && removed.length > 0)
  }

  getProductIds(): string[] {

    if (!this.hasLines())
      return []

    const productIds = this.lines!.filter(l => l.productId).map(l => l.productId!)

    return productIds
  }

  getProducts(): Product[] {

    if (!this.hasLines())
      return []

    const products = this.lines.map(l => l.product).filter(p => p)

    return products
  }

  /** Gets the resources that are defined in the configuration for all products (used in this order)   
   * 
   *      order.lines[x].product.resources[y].resource 
   * 
   * */
  getProductResources(): Resource[] {

    const resources = []

    if (!this.lines)
      return []

    for (const line of this.lines) {

      if (!line.product || !line.product.resources)
        continue

      for (const productResource of line.product.resources) {

        //if (resource.is)

        if (!productResource.resource)
          continue

        const resource = productResource.resource

        resources.push(resource)
      }
    }

    return resources
  }

  /** Gets the resources that are defined in the configuration for all products (used in this order)   
 * 
 *      order.lines[x].product.resources[y].resource 
 * 
 * */
  getConfigResourceGroups(): Resource[] {

    const configResources = this.getProductResources()
    return configResources.filter(r => r.isGroup)

  }


  getResources(): Resource[] {

    if (!this.lines)
      return []

    let resources: Resource[] = []

    for (const orderLine of this.lines) {

      if (!orderLine.planning)
        continue

      for (const planning of orderLine.planning) {

        if (!(planning.resource))
          continue

        if (resources.findIndex(r => r.id == (planning.resource as Resource)?.id) >= 0)
          continue

        resources.push(planning.resource as Resource)
      }
    }

    resources = _.orderBy(resources, 'type')    //this.resources.sort()

    return resources
  }




  getOrderLinesWithPersonSelect(): OrderLine[] {

    if (!this.lines || this.lines.length == 0)
      return []


    const linesWithMissingProduct = this.lines.filter(ol => !ol.product)

    if (linesWithMissingProduct && linesWithMissingProduct.length > 0) {
      console.error('Products not attached to orderlines!')
      console.error(this, linesWithMissingProduct)
    }

    const linesWithPersonSelect = this.lines.filter(ol => ol.product?.personSelect === true)

    return linesWithPersonSelect;
  }


  /**
   * If order is for more then 1 person, then we need to assign order lines to specific persons.
   * @returns 
   */
  getPersonLines(): PersonLine[] {

    const orderLines = this.getOrderLinesWithPersonSelect()

    if (!orderLines)
      return [];

    const personLines = [];

    for (const ol of orderLines) {
      for (let i = 0; i < ol.qty; i++) {

        const personLine = new PersonLine();

        personLine.orderLineId = ol.id;
        personLine.descr = ol.descr;
        personLine.orderLine = ol;

        let personId: string | null = null

        if (ol.persons && ol.persons.length > i)
          personId = ol.persons[i];
        // else if (this.order && this.order.persons.length > 0) {
        //     let person = personHelper.getPerson(ol, i);
        //     personId = person.id; //   this.order.persons[0].id;
        // }

        if (personId != null)
          personLine.personId = personId;

        personLines.push(personLine);
      }

    }

    return personLines;

  }

  /**
   * if this.nrOfPersons is out of sync with this.persons
   * then update this.persons
   */
  updatePersons() {

    if (!this.persons)
      this.persons = []

    if (this.persons.length != this.nrOfPersons) {
      let mgr = new OrderPersonMgr(this.persons)
      mgr.checkPersons(this.nrOfPersons);
    }
  }

  /** if an order contains multiple services, then this order can be for 1 person or for more then 1 person => we will ask user
   *  This info is essential for the planning that will be performed later on.
   *  Remark: some services do not require this person selection (example: rental of wellness)
   */
  needsPersonSelect(): boolean {
    if (this.gift || !this.hasLines())
      return false

    const personSelectLines = this.lines?.filter(ol => ol.product?.personSelect)

    // ol.qty
    const total = _.sumBy(personSelectLines, 'qty')

    return (total > 1)
  }

  needsStaffSelect(): boolean {
    if (this.gift || !this.hasLines())
      return false

    const staffSelectLine = this.lines?.find(ol => ol.product?.staffSelect)

    return staffSelectLine ? true : false
  }

  needsPlanning(): boolean {

    console.warn('needsPlanning')

    if (this.gift || !this.hasLines())
      return false

    // try to find an order line with resources
    const planningLine = this.lines?.find(ol => ol.product?.planMode != PlanningMode.none)  // .hasResources()

    return planningLine ? true : false
  }


  linesWithPlanning(): OrderLine[] {

    if (!this.lines || this.lines.length == 0)
      return []

    const orderlinesWithPlanning = this.lines?.filter(ol => ol.product?.planMode != PlanningMode.none) // .hasResources()
    return orderlinesWithPlanning
  }


}

/*
order   Order  @relation(fields: [orderId], references: [id])
orderId String @db.Uuid

product   Product @relation(fields: [productId], references: [id])
productId String  @db.Uuid

planning ResourcePlanning[]
*/



export class GiftLineOption {
  id?: string
  name?: string

  @Type(() => GiftLineOptionValue)
  vals: GiftLineOptionValue[] = []
}

export class OrderLineOption extends ObjectWithId {
  name?: string

  @Type(() => OrderLineOptionValue)
  values: OrderLineOptionValue[] = []

  /** Sum of 1 or more formula terms */
  @Type(() => FormulaTerm)
  formula?: FormulaTerm[]

  constructor(productOption?: ProductOption, ...productOptionValues: ProductOptionValue[]) {
    super()
    delete this.id

    if (!productOption)
      return

    this.id = productOption.id
    this.name = productOption.name

    if (productOption.hasFormula && productOption.formula && productOption.formula.length > 0)
      this.formula = productOption.formula

    if (Array.isArray(productOptionValues) && productOptionValues.length > 0) {
      let lineOptionVals = productOptionValues.map(prodVal => new OrderLineOptionValue(prodVal))
      this.values.push(...lineOptionVals)
    }

  }


  static fromProductOption(prodOption: ProductOption): OrderLineOption {
    const olOption = new OrderLineOption()
    olOption.id = prodOption.id
    olOption.name = prodOption.name

    if (prodOption.values && prodOption.values.length > 0) {
      olOption.values = prodOption.values.map(value => OrderLineOptionValue.fromProductOptionValue(value))
    }

    return olOption
  }

  hasFormula(): boolean {
    return Array.isArray(this.formula) && this.formula.length > 0
  }


  getValue(value: OrderLineOptionValue): OrderLineOptionValue {

    let olOptionValue = this.values.find(o => o.id == value.id)

    if (!olOptionValue) {
      const clone = ObjectHelper.clone(value, OrderLineOptionValue) as OrderLineOptionValue

      this.values.push(clone)
      olOptionValue = clone
    }

    return olOptionValue
  }

  getValueById(valueId: string): OrderLineOptionValue | undefined {

    return this.values.find(o => o.id == valueId)
  }

  removeValueById(valueId: string) {
    _.remove(this.values, v => v.id === valueId)
  }


}


export class GiftLineOptionValue {
  id?: string
  name?: string
  prc = 0
}

export class OrderLineOptionValue extends ObjectWithId {
  name?: string;

  @Type(() => Number)
  dur = 0

  @Type(() => Number)
  prc = 0

  @Type(() => Number)
  val = 0

  // @Type(() => Number)
  // factor = 0

  constructor(productOptionValue?: ProductOptionValue) {
    super()

    if (!productOptionValue)
      return

    this.id = productOptionValue.id
    this.name = productOptionValue.name
    this.dur = productOptionValue.duration
    this.val = productOptionValue.value

    this.prc = productOptionValue.price
    //this.factor = productOptionValue.factor
  }

  static fromProductOptionValue(prodOptionValue: ProductOptionValue): OrderLineOptionValue {
    const olOptionValue = new OrderLineOptionValue()
    olOptionValue.id = prodOptionValue.id
    olOptionValue.name = prodOptionValue.name
    olOptionValue.dur = prodOptionValue.duration
    olOptionValue.val = prodOptionValue.value

    olOptionValue.prc = prodOptionValue.price
    //olOptionValue.factor = prodOptionValue.factor
    return olOptionValue
  }

  getPrice(formula?: FormulaTerm[], options?: OrderLineOption[]): number {

    if (!formula)
      return this.prc
    else { // if (formula && options)

      let sum = 0

      for (const formulaTerm of formula) {

        let term = formulaTerm.factor

        if (formulaTerm.value)
          term *= this.val

        if (formulaTerm.optionId && options) {

          const formulaOption = options.find(o => o.id == formulaTerm.optionId)

          if (formulaOption && formulaOption.values.length > 0) {
            term *= formulaOption.values[0].val
          }
        }

        sum += term

      }

      return sum
    }



    return 0
    // if (!factorOption || !factorOption.values)
    //   return this.price
    // else {
    //   let extraTerms = 0

    //   factorOption.values.forEach(val => {
    //     extraTerms += this.factor * val.value
    //   })

    //   return this.price + extraTerms
    // }

  }

  isVisible(): boolean {
    return this.name?.trim() != "0"
  }
}





export class OrderLine extends ObjectWithId {

  idx = 0;

  @Type(() => Order)
  order?: Order;
  orderId?: string;

  @Type(() => Product)
  product?: Product;
  productId?: string

  @Type(() => ResourcePlanning)
  planning?: ResourcePlanning[]

  @Type(() => OrderLineOption)
  options: OrderLineOption[] = []

  descr?: string;
  start?: number;
  end?: number;

  @Type(() => Number)
  qty = 1;

  /** (unit) base price = price excluding options, only set when there are options */
  @Type(() => Number)
  base = 0;

  /** unit price = base price + all option prices */
  @Type(() => Number)
  unit = 0;

  @Type(() => Number)
  excl = 0;

  @Type(() => Number)
  vat = 0;

  @Type(() => Number)
  vatPct = 0;

  @Type(() => Number)
  incl = 0;

  /** preferred human resource ids for this line */
  hrIds?: string[]

  /** preferred location resource ids for this line */
  lrIds?: string[]

  persons?: string[];
  tag?: string;
  active = true;
  deleted = false;
  createdAt = new Date()
  updatedAt?: Date
  deletedAt?: Date


  constructor(product?: Product, qty = 1, initOptionValues?: Map<String, String[]>) {
    super()


    this.qty = qty

    if (!product)
      return


    this.descr = product.name
    this.base = product.salesPrice
    //this.incl = product.salesPrice
    this.vatPct = product.vatPct
    this.productId = product.id
    this.product = product

    if (!product.options)
      return

    for (const option of product.options) {

      let optionValues: ProductOptionValue[]

      if (initOptionValues && initOptionValues.has(option.id)) {
        let valueIds = initOptionValues.get(option.id)

        if (Array.isArray(valueIds) && valueIds.length > 0) {

          optionValues = option.getValues(valueIds)


        }
      }

      if (!Array.isArray(optionValues) || optionValues.length == 0)
        optionValues = option.getDefaultValues()

      if (optionValues) {
        const orderLineOption = new OrderLineOption(option, ...optionValues)
        this.options.push(orderLineOption)
      }

    }

    this.calculateAll()
    console.error(this.incl)
  }


  static custom(descr: string, unit: number, vatPct: number): OrderLine {

    const line = new OrderLine()
    line.descr = descr
    line.unit = unit
    line.vatPct = vatPct

    line.calculateInclExcl()

    return line

  }

  hasPersons(): boolean {
    return (Array.isArray(this.persons) && this.persons.length > 0)
  }


  /** sum of product duration and all options */
  totalDuration(): number | null {

    if (!this.product)
      return null

    let duration = this.product.duration

    if (!this.options)
      return duration

    for (const option of this.options) {

      if (!option.values || option.values.length == 0)
        continue

      for (const value of option.values) {
        if (Number.isFinite(value.dur))
          duration += value.dur
      }

    }

    return duration

  }

  calculateAll() {
    this.setUnitPrice()
    this.calculateInclExcl()
  }

  calculateInclExcl() {
    this.incl = this.unit * this.qty
  }

  setUnitPrice() {

    console.warn('makeTotals')



    let unitPrice = this.base
    //let totalDuration = 0

    if (!Array.isArray(this.options) || this.options.length == 0) {
      for (const option of this.options) {
        if (!option.values)
          continue

        // let factorOption = null

        // if (option.factorOptionId) {
        //   factorOption = this.options.find(o => o.id == option.factorOptionId)
        // }


        for (const orderLineOptionValue of option.values) {
          unitPrice += orderLineOptionValue.getPrice(option.formula, this.options)
          // totalDuration += value.duration
        }
      }
    }


    this.unit = unitPrice

    //this.incl = unitPrice * this.qty


  }

  visibleOptions(): OrderLineOption[] {

    return this.options.filter(o => o.values && o.values.findIndex(v => v.isVisible()) >= 0)

  }


  getOption(option: OrderLineOption): OrderLineOption {

    let olOption = this.options.find(o => o.id == option.id)

    if (!olOption) {
      const clone = ObjectHelper.clone(option, OrderLineOption) as OrderLineOption
      clone.values = []

      this.options.push(clone)
      olOption = clone
    }

    return olOption
  }


  optionValueSelected(option: OrderLineOption, valueId: string): boolean {

    const olOption = this.getOption(option)

    const value = olOption.getValueById(valueId)

    return value ? true : false
  }

  allOptionValues(): OrderLineOptionValue[] {

    if (!this.options)
      return []

    const optionValues: OrderLineOptionValue[] = []

    for (const option of this.options) {
      if (option.values && option.values.length > 0)
        optionValues.push(...option.values)
    }

    return optionValues
  }



  // getOption(option: OrderLineOption): OrderLineOption {

  //   let olOption = this.options.find(o => o.id == option.id)

  //   if (!olOption) {
  //     const clone = ObjectHelper.clone(option, OrderLineOption) as OrderLineOption
  //     clone.values = []

  //     this.options.push(clone)
  //     olOption = clone
  //   }

  //   return olOption
  // }


}

// feestdag, klein verlet

export enum PlanningType {
  /** occupied */
  occ = 'occ',   // occupied
  hol = 'hol',   // holidays 
  bnk = 'bnk',   // bank holiday
  ill = 'ill',
  abs = 'abs',   // absence, not paid by employer
  edu = 'edu',
  avl = 'avl',    // available
  sch = 'sch'     // planning schedule
}


/*



enum PlanningType {
  occ
  res   // reserved
  hol
  ill 
  edu
  off
}



*/



/** Manage multiple ResourcePlanning's  */
export class ResourcePlannings {


  constructor(public plannings: ResourcePlanning[] = []) {

  }

  isEmpty(): boolean {
    return (!Array.isArray(this.plannings) || this.plannings.length === 0)
  }

  filterByResource(resourceId: string): ResourcePlannings {
    const planningsForResource = this.plannings.filter(rp => rp.resourceId == resourceId)

    if (!Array.isArray(planningsForResource))
      return new ResourcePlannings()

    return new ResourcePlannings(planningsForResource)
  }


  filterByResourceOverlapAllowed(resourceId: string, overlap: boolean = false): ResourcePlannings {

    const planningsForResource = this.plannings.filter(rp => rp.resourceId == resourceId && rp.overlap == overlap && !rp.scheduleId)

    if (!Array.isArray(planningsForResource))
      return new ResourcePlannings()

    return new ResourcePlannings(planningsForResource)
  }


  filterByResourceDateRange(resourceId: string, from: Date | number, to: Date | number): ResourcePlannings {

    let fromNum = from instanceof Date ? DateHelper.yyyyMMddhhmmss(from) : from
    let toNum = to instanceof Date ? DateHelper.yyyyMMddhhmmss(to) : to

    const planningsForResource = this.plannings.filter(rp => rp.resourceId == resourceId && rp.end > fromNum && rp.start < toNum)

    if (!Array.isArray(planningsForResource))
      return new ResourcePlannings()

    return new ResourcePlannings(planningsForResource)
  }



  filterByScheduleDateRange(scheduleId: string, from: Date | number, to: Date | number): ResourcePlannings {

    let fromNum = from instanceof Date ? DateHelper.yyyyMMddhhmmss(from) : from
    let toNum = to instanceof Date ? DateHelper.yyyyMMddhhmmss(to) : to

    let plannings = this.plannings.filter(rp => rp.scheduleId == scheduleId && rp.end > fromNum && rp.start < toNum)

    return new ResourcePlannings(plannings)
  }

  filterBySchedulesDateRange2(scheduleIds: string[], from: Date | number, to: Date | number): ResourcePlannings {

    let fromNum = from instanceof Date ? DateHelper.yyyyMMddhhmmss(from) : from
    let toNum = to instanceof Date ? DateHelper.yyyyMMddhhmmss(to) : to

    let plannings = this.plannings.filter(rp => rp.scheduleId && scheduleIds.indexOf(rp.scheduleId) >= 0 && rp.end > fromNum && rp.start < toNum)

    return new ResourcePlannings(plannings)
  }

  /**
   *  example use: given all schedules for a branch (default opening hours, holidays, special openings,... -> defined by scheduleIds), return only
   *  those (resource plannings=schedules & their date-ranges) during a certain interval
   * @param scheduleIds 
   * @param dateRange 
   * @returns 
   */
  filterBySchedulesDateRange(scheduleIds: string[], dateRange: DateRange): ResourcePlannings {

    if (!Array.isArray(scheduleIds) || scheduleIds.length == 0)
      return new ResourcePlannings()

    const fromNum = dateRange.fromToNum()
    const toNum = dateRange.toToNum()

    let planningsForSchedules = this.plannings.filter(rp => rp.scheduleId && scheduleIds.indexOf(rp.scheduleId) >= 0
      && rp.end && rp.end > fromNum && rp.start && rp.start < toNum)

    if (!Array.isArray(planningsForSchedules))
      return new ResourcePlannings()

    planningsForSchedules = _.orderBy(planningsForSchedules, 'start')

    return new ResourcePlannings(planningsForSchedules)
  }

  filterBySchedulesDate(scheduleIds: string[], date: Date): ResourcePlanning {

    if (!Array.isArray(scheduleIds) || scheduleIds.length == 0)
      return undefined

    const dateNum = DateHelper.yyyyMMddhhmmss(date) //dateRange.fromToNum()

    let planningsForSchedules = this.plannings.filter(rp => rp.scheduleId && scheduleIds.indexOf(rp.scheduleId) >= 0
      && rp.start && rp.end && rp.start <= dateNum && dateNum < rp.end)

    if (!Array.isArray(planningsForSchedules) || planningsForSchedules.length == 0)
      return undefined

    return planningsForSchedules[0]
  }

  isFullAvailable(): boolean {
    const unavailable = this.plannings.find(rp => rp.active && !rp.available && !rp.scheduleId)

    return unavailable ? false : true
  }

  isPrepTimeOnly(): boolean {

    // try to find a planning that is NOT a preparation
    const nonPrep = this.plannings.find(rp => rp.active && !rp.prep)

    return nonPrep ? false : true
  }


  filterByAvailable(available = true): ResourcePlannings {

    const result = this.plannings.filter(rp => rp.available == available && !rp.scheduleId)

    if (!Array.isArray(result))
      return new ResourcePlannings()

    return new ResourcePlannings(result)
  }

  toDateRangeSet(): DateRangeSet {

    const dateRanges = this.plannings.map(rp => rp.toDateRange())
    const set = new DateRangeSet(dateRanges)
    return set

  }

  groupByResource(): _.Dictionary<ResourcePlanning[]> {

    // const map = new Map<Resource, ResourcePlanning[]>()


    const map = _.groupBy(this.plannings, 'resourceId')

    return map

  }
}


export class PlanningProductOptionInfo {

  nm?: string
  val?: unknown
}

export class PlanningProductInfo {
  /** name */
  nm?: string

  @Type(() => PlanningProductOptionInfo)
  options?: PlanningProductOptionInfo[] = []


  constructor(productName?: string) {
    this.nm = productName
  }
}


export class PlanningContactInfo {

  /** first name */
  fst?: string

  /** last name */
  lst?: string

}


export class PlanningResourceInfo {
  /** name */
  nm?: string

  tp?: ResourceType

  constructor(resourceName?: string, resourceType?: ResourceType) {
    this.nm = resourceName
    this.tp = resourceType
  }
}

export class PlanningInfo {

  /** product info */
  @Type(() => PlanningProductInfo)
  prods: PlanningProductInfo[] = []

  /** contact (customer) info */
  @Type(() => PlanningContactInfo)
  cont?: PlanningContactInfo

  /** resource info */
  @Type(() => PlanningResourceInfo)
  res?: PlanningResourceInfo

  constructor(productInfo: PlanningProductInfo, contactInfo?: PlanningContactInfo, resourceInfo?: PlanningResourceInfo) {
    this.prods.push(productInfo)

    this.cont = contactInfo
    this.res = resourceInfo
  }

  toString(): string {

    let info = ``

    if (Array.isArray(this.prods)) {

      this.prods.forEach(prod => {
        info += `${prod.nm}`
      })
    }

    /*     if (this.res) {
          info += ` ${this.res.nm}`
        } */

    return info
  }


}

export class ResourcePlanning extends ObjectWithId implements IAsDbObject<ResourcePlanning> {
  branchId?: string;

  @Type(() => Resource)
  resource?: Resource //| ConnectTo
  resourceId?: string;

  @Type(() => Resource)
  resourceGroup?: Resource;
  resourceGroupId?: string;

  orderId?: string
  @Type(() => Order)
  order?: Order;

  orderLineId?: string;
  @Type(() => OrderLine)
  orderLine?: OrderLine;

  autoResourceId?: string;


  @Type(() => Schedule)
  schedule?: Schedule | ConnectTo
  scheduleId?: string;

  /** label coming from ProductResource */
  label?: string

  /** stored as JSON in database */
  @Type(() => PlanningInfo)
  info?: PlanningInfo

  type = PlanningType.occ

  start?: number = DateHelper.yyyyMMddhhmmss(new Date())
  end?: number = DateHelper.yyyyMMddhhmmss(new Date())

  /** is preperation time (before or after actual treatment) */
  prep: boolean = false

  /** overlap allowed (used if prep=true). Example: when cleaning of wellness can overlap the preparation of the next session */
  overlap: boolean = false

  // service?: string;
  // customer?: string;
  pre = 0
  post = 0
  active = true;
  deleted = false;
  createdAt = new Date()
  updatedAt?: Date
  deletedAt?: Date


  asDbObject(): DbObject<ResourcePlanning> {
    return new DbObject<ResourcePlanning>('resourcePlanning', ResourcePlanning, this)
  }

  clone(): ResourcePlanning {

    return ObjectHelper.clone(this, ResourcePlanning)
  }

  get available(): boolean {
    return (this.type === PlanningType.avl)
  }

  get startUtc() {
    const start = DateHelper.parse(this.start)
    return TimeHelper.hhmmUTC(start)
  }

  set startUtc(val: string) {
    const start = TimeHelper.hhmmUTCToDate(val)
    this.start = DateHelper.yyyyMMdd000000(start)

  }


  set startDate(value: Date) {
    this.start = DateHelper.yyyyMMddhhmmss(value)
    console.warn(this.start)
  }

  get startDate() {
    return DateHelper.parse(this.start)
  }

  set endDate(value: Date) {
    this.end = DateHelper.yyyyMMddhhmmss(value)
  }

  get endDate() {
    return DateHelper.parse(this.end)
  }

  toDateRange(): DateRange {

    const range = DateRange.fromNumbers(this.start!, this.end!)

    return range
  }

  setResource(resource: Resource) {

    if (!resource)
      return

    this.resourceId = resource.id
    this.resource = resource

  }

}




export enum ProductType {
  prod = 'prod',
  svc = 'svc',
  // OLD: do not use anymore
  /* product = 'product',
  service = 'service', */
  //  category = 'category',
  // bundle = 'bundle',
  // subscription = 'subscription',
}

export enum ProductSubType {
  basic = 'basic',   // a basic product or service
  cat = 'cat',       // a category
  bundle = 'bundle', // a composed product or arrangement
  subs = 'subs',     // a subscription
}

export enum PriceType {
  sales = 'sales',
  purchase = 'purchase',
  tax = 'tax',
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

export enum TemplateType {
  general = 'general',
  confirmation = 'confirmation',
  cancel = 'cancel',
  cancelClient = 'cancelClient',
  cancelProvider = 'cancelProvider',
  change = 'change',
  reminder = 'reminder'
}

export enum OrderTemplate {
  noDepositCancel = 'noDepositCancel'
}

export const orderTemplates = ['waitDeposit', 'confirmed', 'noDepositCancel', 'inTimeCancel', 'lateCancel', 'reminder', 'noShow', 'satisfaction']

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

export class Template extends ObjectWithId {
  orgId?: string
  branchId?: string
  idx = 0

  to: string[] = []
  channels: string[] = []

  /** category (example: order) */
  cat?: string

  code?: string | null
  name?: string | null
  language?: string | null
  subject?: string | null
  body?: string | null
  short?: string | null
  remind = 60
  active = true
  deleted = false
  deletedAt?: Date | null

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



  mergeWithOrder(order: Order): Message {

    const message = new Message()

    message.branchId = order.branchId
    message.orderId = order.id

    const replacements = { name: "Nils", info: "baby giraffe" }

    if (this.body) {
      const hbTemplate = Handlebars.compile(this.body)
      message.body = hbTemplate(replacements)
    }

    if (this.subject) {
      const hbTemplate = Handlebars.compile(this.subject)
      message.subject = hbTemplate(replacements)
    }

    message.type = this.msgType()

    return message

  }

}

export enum GiftType {
  // none = 'none', // when nothing is selected yet
  amount = 'amount',
  specific = 'specific',
  prod = 'prod',
  svc = 'svc'
}

export enum GiftCertificate {
  none = 'none',
  inStore = 'inStore',
  postal = 'postal',
}

export class GiftMethods {
  emailFrom = false
  emailTo = false
  postal = false
  pos = false
  app = false
}


/** GiftLine is a reduced version of an orderLine.
 *  It is used for specific gift (products/services are gifted) instead of an amount.
 *  
 */
export class GiftLine {

  qty = 1
  prc = 0

  /** product id */
  pId?: string

  /** options */
  @Type(() => GiftLineOption)
  opts: GiftLineOption[] = []

  descr?: string


  // initOptionValues?: Map<String, String[]>

  getOptionValuesAsMap(): Map<String, String[]> {

    const map = new Map<String, String[]>()

    if (!Array.isArray(this.opts))
      return map

    for (let option of this.opts) {

      const optionId = option.id
      const valueIds = option.vals.map(val => val.id)

      if (optionId && Array.isArray(valueIds) && valueIds.length > 0)
        map.set(optionId, valueIds)

    }


    return map
  }


}


export enum CanUseGiftMsg {
  notActive = 'notActive',
  alreadyConsumed = 'alreadyConsumed',
  invalidAmount = 'invalidAmount',
  partialAmount = 'partialAmount'
}
export class CanUseGift {
  constructor(public valid: boolean, public amount: number, public msg?: CanUseGiftMsg, public debug?: string) { }
}

/**
 * Changes:
 *   value?: number
 *   type?: GiftType   specific
 *   invoice = false
 */

export class Gift extends ObjectWithId {
  orgId?: string;
  branchId?: string;

  /*
  fromId String? @db.Uuid
  from   Contact? @relation(name: "giftsGiven", fields: [fromId], references: [id])

  toId String? @db.Uuid
  to   Contact? @relation(name: "giftsReceived", fields: [toId], references: [id])
*/

  fromId?: string;
  from?: Contact

  toId?: string;
  to?: Contact

  orderId?: string;
  type?: GiftType

  @Type(() => GiftLine)
  lines?: GiftLine[] = []

  invoice = false

  /** the vat% that will be used if gift is invoice and type=amount  */
  @Type(() => Number)
  vatPct?: number

  code?: string;
  descr?: string;
  expiresOn?: Date;

  @Type(() => Number)
  value?: number

  @Type(() => Number)
  used = 0

  isConsumed = false
  fromName?: string;
  fromEmail?: string;
  toName?: string;
  toEmail?: string;
  toAddress?: string;
  toMessage?: string;
  //  toSendEmail = false


  @Type(() => GiftMethods)
  methods: GiftMethods = new GiftMethods()

  //certificate: GiftCertificate = GiftCertificate.inStore
  active = true
  deleted = false
  createdAt = new Date()
  updatedAt?: Date
  deletedAt?: Date

  isAmount() {
    return this.type == GiftType.amount
  }

  /** check if given amount (or less) can be used */
  canUse(amount: number): CanUseGift {

    if (!amount || amount <= 0)
      return new CanUseGift(false, 0, CanUseGiftMsg.invalidAmount, `amount=${amount}`)

    if (!this.active)
      return new CanUseGift(false, 0, CanUseGiftMsg.notActive)

    if (this.isConsumed)
      return new CanUseGift(false, 0, CanUseGiftMsg.alreadyConsumed, `isConsumed=true`)

    let available = this.availableAmount()

    if (!available || available < 0)
      return new CanUseGift(false, 0, CanUseGiftMsg.alreadyConsumed, `available=${available}`)


    if (amount <= available)
      return new CanUseGift(true, amount)
    else {
      return new CanUseGift(true, amount, CanUseGiftMsg.partialAmount)
    }

  }

  use(amount: number) {

    this.used += amount

    if (this.used >= this.value)
      this.isConsumed = true
    else
      this.isConsumed = false
  }

  free(amount: number) {

    this.used -= amount

    if (this.used < this.value)
      this.isConsumed = false

  }


  isSpecific() {
    return this.type == GiftType.specific
  }

  availableAmount() {

    if (this.used && this.used > 0)  // we had a bug that used was negative
      return this.value - this.used

    return this.value

  }

  hasLines() {
    return Array.isArray(this.lines) && this.lines.length > 0
  }

  methodSelected() {
    const methods = this.methods
    return (methods.emailFrom || methods.emailTo || methods.pos || methods.postal)

  }
}


export enum PaymentType {
  cash = 'cash',
  transfer = 'transfer',
  credit = 'credit',
  debit = 'debit',
  gift = 'gift',
  /** subscription */
  subs = 'subs',
}



export class Payment extends ObjectWithId {

  idx = 0

  @Type(() => Order)
  order?: Order;
  orderId?: string;

  @Type(() => Number)
  amount = 0

  type: string
  loc: string


  @Type(() => Gift)
  gift?: Gift
  giftId?: string

  @Type(() => Subscription)
  subs?: Subscription
  subsId?: string

  bankTxId?: string
  bankTxNum?: string

  date?: Date = new Date()

  info?: string
  declared: boolean = false

}

export enum TaskSchedule {
  once = 'once',
  daily = 'daily',
  twiceAWeek = 'twiceAWeek',
  weekly = 'weekly',
  twiceAMonth = 'twiceAMonth',
  monthly = 'monthly',
  quarterly = 'quarterly',
  yearly = 'yearly',
  manual = 'manual'
}

export enum TaskStatus {
  todo = 'todo',
  progress = 'progress',
  done = 'done',
  skip = 'skip'
}

export enum TaskPriority {
  notUrgent = 0,
  normal = 10,
  asap = 20,
  urgent = 30
}

export class Task extends ObjectWithId {
  branchId?: string

  name: string
  loc?: string
  info?: string

  prio = TaskPriority.normal

  date?: number // format: yyyymmdd
  time: string // format: hh:mm

  // the parent recurring task
  rTaskId?: string

  schedule = TaskSchedule.once

  /** if coming from recurring task: schedule of recurring task */
  origSched?: TaskSchedule

  /** human resources = staff, links to a resource or resource group */
  hrIds?: string[] = []

  /* the staff member that executes/executed the task (never a resource group) */
  hrExecId?: string

  hrExec?: Resource

  /* the user */
  userId?: string

  /* name of user executing/executed task */
  by?: string

  status = TaskStatus.todo

  imp?: string  // important
  cmt?: string  // comment

  active = true

  createdAt = new Date()
  startedAt?: Date
  finishedAt?: Date
  updatedAt?: Date
  deletedAt?: Date


  /** Convert a recurring task (schedule<>'once') into a concrete task (schedule='once') */
  toInstance(): Task {

    let clone: Task = ObjectHelper.clone(this, Task)

    clone.id = ObjectHelper.newGuid()
    clone.createdAt = new Date()
    clone.origSched = this.schedule
    clone.schedule = TaskSchedule.once
    clone.rTaskId = this.id

    // clone.id = null  // because it is a new task

    return clone
  }

  isRecurrent(): boolean {
    return this.schedule != TaskSchedule.once
  }

  htmlStyle(): string {
    return `color: ${this.color()}`
  }

  get template(): boolean {
    return this.schedule == TaskSchedule.manual
  }

  set template(value: boolean) {

    if (value)
      this.schedule = TaskSchedule.manual
    else
      this.schedule = TaskSchedule.once

    //return this.schedule == TaskSchedule.manual
  }

  private backColorForSchedule(schedule: TaskSchedule): string {

    switch (schedule) {

      case TaskSchedule.daily:
        return '#FFF0F0'

      case TaskSchedule.twiceAWeek:
        return '#F2FAFF'

      case TaskSchedule.weekly:
        return '#E5F5FF'

    }

    return "white"
  }


  backColor() {

    if (this.origSched)
      return this.backColorForSchedule(this.origSched)
    else return this.backColorForSchedule(this.schedule)

  }

  color(): string {
    switch (this.prio) {
      case TaskPriority.urgent:
        return 'red'
      case TaskPriority.asap:
        return 'orange'
      default:
        return 'green'
    }
  }
}


/**
 *  Introduced to store web push subscriptions for users, but any extra JSON can be stored here for any object
 */
export class CustomJson extends ObjectWithId {
  objId?: string

  type?: string

  label?: string

  json?: any

  createdAt = new Date()
}

export enum ObjectLogAction {

  /** new object */
  new = 'new',

  /** update */
  upd = 'upd',

  /** soft delete */
  sftDel = 'sftDel',

  /** hard delete */
  hrdDel = 'sftDel'
}

export class ObjectLog extends ObjectWithId {

  branchId?: string

  /** if obj belongs to another parent object (example: objId is a payment-id & parentId is order-id) */
  parentId?: string

  objId?: string

  userId?: string

  action?: ObjectLogAction

  data?: any

  date = new Date()


  static update(objId?: string, data?: any): ObjectLog {
    let log = new ObjectLog()

    log.objId = objId
    log.data = data
    log.action = ObjectLogAction.upd

    return log
  }


}


/*
model CustomJson {
  id String @id(map: "newtable_pk") @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  objId String? @db.Uuid
  type String?   // the object type

  label String?  // specifies what the json is about

  json Json?

  createdAt DateTime @default(now())
}



*/