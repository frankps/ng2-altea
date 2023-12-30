/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Exclude, Type, Transform } from "class-transformer";
import 'reflect-metadata';
import { ConnectTo, DateHelper, DbObject, IAsDbObject, ManagedObject, ObjectHelper, ObjectMgmt, ObjectReference, ObjectWithId, QueryOperator, TimeHelper } from 'ts-common'
import * as _ from "lodash";
import { PersonLine } from "./person-line";
import { DateRange, DateRangeSet, TimeBlock, TimeBlockSet, TimeSpan } from "./logic";
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"

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
  female = 'female',
  male = 'male',
  unisex = 'unisex',
}

export enum OnlineMode {
  reserve = 'reserve',
  visible = 'visible',
  invisible = 'invisible',
}



export enum ProductTypeIcons {
  product = 'fa-duotone fa-box',
  service = "fa-duotone fa-person-dress",
  category = "fa-duotone fa-folder-open",
  bundle = "fa-duotone fa-boxes-stacked",
  subscription = "fa-duotone fa-id-card"
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

export class Contact extends ObjectWithId {
  //@Type(() => Organisation)
  organisation?: Organisation;

  orgId?: string;

  @Type(() => Order)
  orders?: Order[];
  name?: string;
  first?: string;
  last?: string;
  gender: Gender = Gender.unisex
  birth?: Date;
  email?: string;
  emailRemind = true
  mobile?: string;
  smsRemind = false
  phone?: string;
  street?: string;
  streetNr?: string;
  postal?: string;
  country?: string;
  city?: string;
  language?: string;
  company?: string;
  vatNum?: string;
  branches?: string[];

  depositPct?: number


  active = true
  deleted = false
  deletedAt?: Date;

  subscriptions?: Subscription[]
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

  active = true;
  deleted = false;
  createdAt = new Date()
  updatedAt?: Date
  deletedAt?: Date

  getDaySchedule(day: Date): DaySchedule {
    const daySchedule = new DaySchedule()
    daySchedule.blocks.push(new ScheduleTimeBlock())
    return daySchedule
  }

  toDateRangeSet(from: Date | number, to: Date | number): DateRangeSet {

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

          dateRangeSet.addRangeByDates(fromDate, toDate)

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

  /** apply this series definition within given date range (inRange) */
  makeBlocks(inRange: DateRange): DateRangeSet {

    const start = dateFns.parse(this.start, 'HH:mm', inRange.from)

    const result = DateRangeSet.empty

    let loop = start
    let count = 0

    while (loop < inRange.to && count < this.count) {

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

  isCategory = false

  @Type(() => Price)
  prices?: Price[]

  @Type(() => ProductOption)
  options?: ProductOption[]

  @Type(() => ProductResource)
  resources?: ProductResource[]

  lines?: OrderLine[]

  @Type(() => ProductItem)
  items?: ProductItem[]

  @Type(() => ProductItem)
  usedIn?: ProductItem[]
  idx?: number;
  name?: string;
  short?: string;
  type?: ProductType = ProductType.product
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

  deposit = 0

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

    if (this.isCategory)
      return ProductTypeIcons.category
    else if (this.type)
      return ProductTypeIcons[this.type]
    else
      return ""
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

  getBlockSeries(scheduleId: string) {

    return this.plan?.filter(blockSeries => Array.isArray(blockSeries.scheduleIds) && blockSeries.scheduleIds.indexOf(scheduleId) >= 0)
  }

  isSubscription() {
    return this.type == ProductType.subscription
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

export class Price extends ObjectWithId {

  productId?: string;
  product?: Product;
  productOptionValueId?: string;
  productOptionValue?: ProductOptionValue;
  type?: PriceType = PriceType.sales

  @Type(() => Number)
  value?: number = 0

//  @Type(() => Date)
  start?: number | null;

//  @Type(() => Date)
  end?: number| null;

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

  idx = 0

  constructor(productId?: string) {
    super()


    this.productId = productId

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

  toReminder(appointmentDate: Date) : Reminder {
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

export class Branch extends ObjectWithId {

  orders?: Order[];
  idx = 0

  //@Type(() => Organisation)
  organisation?: Organisation;

  orgId?: string;
  name?: string;
  short?: string;
  descr?: string;
  street?: string;
  streetNr?: string;
  postal?: string;
  country?: string;
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
  room = 'room',
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
  onlineBookings?: boolean;
  type?: ResourceType;
  branches?: string[];
  active?: boolean;
  deleted?: boolean;
  deletedAt?: Date;

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
  hasFactor = false
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

  getDefaultValue(): ProductOptionValue | undefined {
    if (!this.values || this.values.length == 0)
      return undefined

    return this.values.find(v => v.default)

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

  @Type(() => Number)
  factor = 0

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






export class Invoice extends ObjectWithId {

  orders?: Order[];
  num?: string;
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


export class Order extends ObjectWithId implements IAsDbObject<Order> {

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

  @Type(() => Subscription)
  subscriptions?: Subscription[];
  // satisfaction?: Satisfaction;
  appointment = false;

  start?: number; // format: yyyyMMddHHmmss


  end?: number; // format: yyyyMMddHHmmss
  descr?: string;
  type = OrderType.sales

  @Type(() => Number)
  excl = 0;

  @Type(() => Number)
  vat = 0;

  @Type(() => Number)
  incl = 0;

  @Type(() => Number)
  deposit = 0;


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
  createdAt = new Date();
  updatedAt?: Date;
  deletedAt?: Date;

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


  asDbObject(): DbObject<Order> {
    return new DbObject<Order>('order', Order, this)
  }

  clone(): Order {

    return ObjectHelper.clone(this, Order)
  }

  hasPersons(): boolean {
    return (Array.isArray(this.persons) && this.persons.length > 0)
  }

  hasLines(): boolean {
    return (Array.isArray(this.lines) && this.lines.length > 0)
  }

  getLine(orderLineId: string): OrderLine | undefined {

    return this.lines?.find(l => l.id == orderLineId)
  }

  addLine(orderLine: OrderLine) {

    if (!this.lines)
      this.lines = []

    orderLine.setUnitPrice()
    this.lines.push(orderLine)

    orderLine.markAsNew()


    this.makeTotals()
  }

  makeTotals(): number {

    if (!this.lines)
      return 0

    let incl = 0

    for (const line of this.lines) {

      line.incl = line.qty * line.unit
      line.markAsUpdated('incl')

      incl += line.incl
    }

    this.incl = incl
    this.markAsUpdated('incl')

    return this.incl
  }


  deleteLine(orderLine: OrderLine) {

    if (!this.lines || !orderLine)
      return

    _.remove(this.lines, l => l.id == orderLine.id)

    this.makeTotals()
  }

  getProductIds(): string[] {

    if (!this.hasLines())
      return []

    const productIds = this.lines!.filter(l => l.productId).map(l => l.productId!)

    return productIds
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


  linesWithPlanning(): OrderLine[] {

    if (!this.lines || this.lines.length == 0)
      return []

    const orderlinesWithPlanning = this.lines?.filter(ol => ol.product?.hasResources())
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

export class OrderLineOption extends ObjectWithId {
  name?: string

  @Type(() => OrderLineOptionValue)
  values: OrderLineOptionValue[] = []

  /** Sum of 1 or more formula terms */
  @Type(() => FormulaTerm)
  formula?: FormulaTerm[]

  constructor(productOption?: ProductOption, productOptionValue?: ProductOptionValue) {
    super()
    delete this.id

    if (!productOption)
      return

    this.id = productOption.id
    this.name = productOption.name

    if (productOption.hasFormula && productOption.formula && productOption.formula.length > 0)
      this.formula = productOption.formula

    // if (productOption.hasFactor)
    //   this.factorOptionId = productOption.factorOptionId

    if (!productOptionValue)
      return

    const orderLineOptionValue = new OrderLineOptionValue(productOptionValue)
    this.values.push(orderLineOptionValue)

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

  /** base price = price excluding options */
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
  persons?: string[];
  tag?: string;
  active = true;
  deleted = false;
  createdAt = new Date()
  updatedAt?: Date
  deletedAt?: Date


  constructor(product?: Product, qty = 1) {
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

      const defaultValue = option.getDefaultValue()

      if (defaultValue) {
        const orderLineOption = new OrderLineOption(option, defaultValue)
        this.options.push(orderLineOption)
      }

    }

    this.calculateAll()
    console.error(this.incl)
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

    if (!this.options)
      return

    let unitPrice = this.base
    //let totalDuration = 0

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
  avl = 'avl'    // available
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


  filterBySchedulesDateRange(scheduleIds: string[], dateRange: DateRange): ResourcePlannings {

    if (!Array.isArray(scheduleIds) || scheduleIds.length == 0)
      return new ResourcePlannings()

    const fromNum = dateRange.fromToNum()
    const toNum = dateRange.toToNum()

    let planningsForSchedules = this.plannings.filter(rp => rp.scheduleId && scheduleIds.indexOf(rp.scheduleId) >= 0 && rp.end && rp.end > fromNum && rp.start && rp.start < toNum)

    if (!Array.isArray(planningsForSchedules))
      return new ResourcePlannings()

    planningsForSchedules = _.orderBy(planningsForSchedules, 'start')

    return new ResourcePlannings(planningsForSchedules)
  }


  filterByAvailable(available = true): ResourcePlannings {
    const result = this.plannings.filter(rp => rp.available == available)

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


    if (this.res) {
      info += ` ${this.res.nm}`
    }


    return info
  }


}

export class ResourcePlanning extends ObjectWithId implements IAsDbObject<ResourcePlanning> {
  branchId?: string;

  @Type(() => Resource)
  resource?: Resource | ConnectTo
  resourceId?: string;

  @Type(() => Resource)
  resourceGroup?: Resource;
  resourceGroupId?: string;

  @Type(() => OrderLine)
  orderLine?: OrderLine;
  orderLineId?: string;
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
  product = 'product',
  service = 'service',
  //  category = 'category',
  bundle = 'bundle',
  subscription = 'subscription',
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
  value = 'value',
  product = 'product',
}

export enum GiftCertificate {
  none = 'none',
  inStore = 'inStore',
  postal = 'postal',
}

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
  type = GiftType.value
  code?: string;
  descr?: string;
  expiresOn?: Date;
  value = 0
  used = 0
  isConsumed = false
  fromName?: string;
  fromEmail?: string;
  toName?: string;
  toEmail?: string;
  toAddress?: string;
  toMessage?: string;
  toSendEmail = false
  certificate: GiftCertificate = GiftCertificate.inStore
  active = true
  deleted = false
  createdAt = new Date()
  updatedAt?: Date
  deletedAt?: Date
}


export enum TaskSchedule {
  once = 'once',
  daily = 'daily',
  weekly = 'weekly',
  monthly = 'monthly',
  yearly = 'yearly'
}

export enum TaskStatus {
  todo = 'todo',
  progress = 'progress',
  done = 'done'
}

export class Task extends ObjectWithId {
  branchId?: string
  name?: string
  loc?: string
  info?: string

  /** human resource = staff, links to a resource or resource group */
  hrId?: string

  schedule = TaskSchedule.once

  active = true
  deleted = false
  createdAt = new Date()
  updatedAt?: Date
  deletedAt?: Date
}

export class TaskMgmt extends ObjectWithId {

  /* the staff members that see the task, can be a resource group */
  hrShowId?: string

  /* the staff member that executes/executed the task (never a resource group) */
  hrExecId?: string

  status = TaskStatus.todo

  createdAt = new Date()
  startedAt?: Date
  finishedAt?: Date

  cmt?: string
}