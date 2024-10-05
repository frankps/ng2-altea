
import { Branch, DepositMode, DurationMode, DurationReference, Gender, Gift, Invoice, LoyaltyCard, OnlineMode, Order, OrderLine, OrderType, Organisation, ProductOnlineIcons, ProductTypeIcons, Resource, ResourcePlanning, Schedule, Subscription, User, UserBase } from "ts-altea-model";
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



/**
 *  A formula term: factor * (value + inc) * option
 */
export class FormulaTerm {
  factor = 1

  value = true

  /** increment/decrement for the value */
  inc = 0
  
  optionId?: string
}

/** Specifies if this option is visible in the order(line) preview, if so, selected values will be stored in order.sum[x].o */
export class ProductOptionPreview {
  show = false

  pre: string = ""

  suf: string = ""
}

export class ProductOption extends ObjectWithIdPlus {
  productId?: string;
  product?: Product;

  @Type(() => ProductOptionValue)
  values?: ProductOptionValue[];
  idx = 0
  name?: string
  short?: string
  descr?: string
  public = true
  required = true
  multiSelect = false

  /** this option(.value) has effect on order.nrOfPersons */
  persons = false

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

  @Type(() => ProductOptionPreview)
  prev?: ProductOptionPreview


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

export class ProductOptionValue extends ObjectWithIdPlus {

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




  get namePrice() {
    return this.name

    if (!this.price || this.price == 0)
      return this.name
    else
      return `${this.name} (+${this.price})`
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


    console.error('makeBlocks', inRange, this)

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



export class Product extends ObjectWithIdPlus {
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

  /** Inform customer after purchase service/product with this extra info */
  inform?: string

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

  /** min number of hours before reservation for free cancel (undefined/null = take setting from Branch, 0 = always free cancel, 24 = 1 day upfront for free cancel, ...) */
  cancel?: number

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

  depositPct?: number

  personSelect = true  // if order is for multiple persons, then customer can specify for each orderLine the person
  staffSelect = true  // customer can specify which staffmember 

  /*   active?: boolean;
    deleted?: boolean; */

  @Type(() => Date)
  deletedAt?: Date;

  //@TransformToNumber()
  @Type(() => Number)
  salesPrice = 0

  advPricing = false


  salesPricing(onDate: Date = new Date()): number {

    if (ArrayHelper.IsEmpty(this.prices))
      return this.salesPrice


    const onDateNum = DateHelper.yyyyMMddhhmmss(onDate)

    var specialPrice = this.prices.find(p => p.start <= onDateNum && onDateNum < p.end)

    if (!specialPrice)
      specialPrice = this.prices.find(p => p.start <= onDateNum && !p.end)


    if (!specialPrice)
      return this.salesPrice

    console.warn(``)

    switch (specialPrice.mode) {
      case PriceMode.abs:
        return specialPrice.value

      case PriceMode.pct: {
        var newPrice = this.salesPrice * (1 - specialPrice.value / 100)
        return newPrice
      }
    }


    return this.salesPrice

  }

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

    let prodResArray = this.resources.filter(r => (r.scheduleIds && r.scheduleIds.indexOf(scheduleId) >= 0) || !r.scheduleIds || r.scheduleIds.length == 0)

    if (ArrayHelper.NotEmpty(prodResArray))
      prodResArray = _.orderBy(prodResArray, 'idx')

    return prodResArray
  }

  getBlockSeries(scheduleId: string): PlanningBlockSeries[] {

    let series = this.plan?.filter(blockSeries => Array.isArray(blockSeries.scheduleIds) && blockSeries.scheduleIds.indexOf(scheduleId) >= 0)

    if (!Array.isArray(series) || series.length == 0)
      series = this.plan?.filter(blockSeries => !Array.isArray(blockSeries.scheduleIds) || blockSeries.scheduleIds.length == 0)

    return series
  }

  getOption(optionId: string): ProductOption {

    if (!this.hasOptions())
      return null

    const option = this.options.find(o => o.id == optionId)

    return option
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


export class ProductResource extends ObjectWithIdPlus {

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

export class ProductItem extends ObjectWithIdPlus {
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

  getOptionValuesAsMap(): Map<String, String[]> {

    if (ArrayHelper.IsEmpty(this.options))
      return null

    const map = new Map<String, String[]>()

    for (let option of this.options) {

      if (!option.hasValue())
        continue

      let values = option.values.map(val => val.id)
      map.set(option.id, values)
    }

    return map
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



export class Price extends ObjectWithIdPlus {

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
