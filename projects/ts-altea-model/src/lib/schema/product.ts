
import { Branch, DepositMode, DurationMode, DurationReference, Gender, Gift, Invoice, LoyaltyCard, OnlineMode, Order, OrderLine, OrderType, Organisation, ProductOnlineIcons, ProductTypeIcons, Resource, ResourcePlanning, Schedule, Subscription, Task, User, UserBase } from "ts-altea-model";
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

export enum ProductOptionDurationMode {
  add = 'add',        // add to the total duration of the service
  custom = 'custom'   // define custom resourceOccupations for the product option
}
export class ProductOption extends ObjectWithIdPlus {
  productId?: string;
  product?: Product;

  @Type(() => ProductOptionValue)
  values?: ProductOptionValue[];
  idx = 0
  name?: string
  short?: string

  /** used to pass option via URL (to open product with options pre-selected) */
  slug?: string
  descr?: string
  public = true
  required = true
  multiSelect = false

  /** this option(.value) has effect on order.nrOfPersons */
  persons = false

  hasDuration = false

  /* only evaluated is hasDuration=true, then if addDur=true, the duration (of selected product option) is 
  automatically added to the total service duration.
  */
  addDur: boolean = true

  /** In case hasDuration=true, the duration (of selected product option) can be added to the total service duration.
   *  Or custom resource plannings can be created (custom).
  
  durMode: ProductOptionDurationMode = ProductOptionDurationMode.add
*/

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

  getDefaultValues(returnFirstIfNoDefault: boolean = true): ProductOptionValue[] | undefined {
    if (!this.hasValues())
      return []

    let values: ProductOptionValue[] = this.values.filter(v => v.default)

    if (returnFirstIfNoDefault && ArrayHelper.IsEmpty(values)) {
      return [this.values[0]]
    }

    return values
  }

  getValue(id: string): ProductOptionValue {

    if (ArrayHelper.IsEmpty(this.values))
      return null

    return this.values.find(v => v.id == id)

  }

  getValues(ids: String[]): ProductOptionValue[] {

    if (!Array.isArray(this.values) || !Array.isArray(ids))
      return []

    const values = this.values.filter(v => ids.indexOf(v.id) >= 0)

    return values
  }

  getValueByValue(value: number): ProductOptionValue {
    if (ArrayHelper.IsEmpty(this.values))
      return null

    return this.values.find(v => v.value == value)
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
  nonActiveSchedules = 'nonActiveSchedules',
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


  @Type(() => Number)
  idx = 0

  /** if rule only applies for certain schedules (typically branch schedules) */
  scheduleIds?: string[]

  /*
  startAt?: string[]  // format 09:30, 11:00

  optionIds?: ObjectReference[]

  operator?: QueryOperator

  @Type(() => Number)
  value?: number

  @Type(() => Number)
  preTime?: number

  @Type(() => Number)
  postTime?: number
  */
}

export enum PlanningMode {
  none = 'none',
  continuous = 'continuous',
  block = 'block'
}

export class PlanningBlockSeries {
  start = "09:00"

  /** default duration of 1 block */
  @Type(() => Number)
  dur = 60

  /** absolute minimum time for 1 block */
  @Type(() => Number)
  min = 60

  /** time between 2 blocks */

  @Type(() => Number)
  post = 15

  /** number of blocks in series */

  @Type(() => Number)
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

    const result = DateRangeSet.empty

    let fromLoop = inRange.from

    // for multi-day ranges
    while (fromLoop < inRange.to) {

      const start = dateFns.parse(this.start, 'HH:mm', fromLoop)

      let loop = start
      let count = 0

      while (loop < inRange.to && (!this.count || count < this.count)) {

        const end = dateFns.addMinutes(loop, this.dur)

        if (loop >= inRange.from && end <= inRange.to) {
          const range = new DateRange(loop, end)
          result.addRanges(range)
        }

        loop = dateFns.addMinutes(end, this.post)
        count++
      }

      fromLoop = dateFns.addDays(fromLoop, 1)
    }


    return result
  }

}


// 'options:orderBy=idx.values:orderBy=idx', 'resources:orderBy=idx', 'items:orderBy=idx', 'prices'


export class Product extends ObjectWithIdPlus {

  static defaultInclude = ['options:orderBy=idx.values:orderBy=idx', 'resources:orderBy=idx', 'items:orderBy=idx', 'prices']

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

  /** certain tasks are related to a product (make a dish, clean-up) */
  @Type(() => Task)
  tasks?: Task[]

  //  bundle: boolean = false

  @Type(() => ProductItem)
  items?: ProductItem[]

  @Type(() => ProductItem)
  usedIn?: ProductItem[]


  @Type(() => Number)
  idx?: number;

  name?: string;
  short?: string;

  /** link to product page on commercial website */
  url?: string;

  /** to identify product in URL (ex. open product page from website) */
  slug?: string;

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


  @Type(() => Number)
  planOrder?: number;

  color?: string;

  @Type(() => ProductRule)
  rules?: ProductRule[]

  /** min number of hours before reservation for free cancel (undefined/null = take setting from Branch, 0 = always free cancel, 24 = 1 day upfront for free cancel, ...) */

  @Type(() => Number)
  cancel?: number


  @Type(() => Number)
  duration = 0

  hasPre = false   // has preparation time

  @Type(() => Number)
  preTime = 15     // preparation time (before actual treatment)


  @Type(() => Number)
  preMaxGap = 0    // max gap between preparation (preTime) and actual treatment

  hasPost = false  // has cleanup time


  @Type(() => Number)
  postTime = 15    // cleanup time (after actual treatment)


  @Type(() => Number)
  postMaxGap = 0   // max gap between actual treatment and cleanup


  @Type(() => Number)
  stock = 0

  @Type(() => Number)
  minStock = 0
  //advance = 0

  @Type(() => Number)
  vatPct = 0

  branches?: string[];


  @Type(() => Number)
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

  /** then price 'As from' will be shown, price can be higher (certain days/moments) using pricing  */
  priceFrom = false

  priceInfo?: string

  advPricing = false

  /** Minimum quantity to order / reserv */
  @Type(() => Number)
  minQty = 1;


  hasSpecialPrices() {

    if (ArrayHelper.IsEmpty(this.prices))
      return false

    let now = new Date()


    // console.log(this.prices)

    let idx = this.prices.findIndex(p => p.act && p.isPromo && !p.giftOpt && (!p.hasDates || (p.startDate <= now && now <= p.endDate)))


    // console.log(idx)

    return idx >= 0
  }

  getSpecialPrices(): Price[] {

    if (ArrayHelper.IsEmpty(this.prices))
      return []

    let now = new Date()


    let prices = this.prices.filter(p => p.act && p.isPromo && !p.giftOpt && (!p.hasDates || (p.startDate <= now && now <= p.endDate)))


    return prices
  }


  hasGiftOptionPrices(): boolean {

    if (ArrayHelper.IsEmpty(this.prices))
      return false

    let idx = this.prices.findIndex(p => p.giftOpt == true)

    return idx >= 0
  }

  getGiftOptionPrices(): Price[] {

    if (ArrayHelper.IsEmpty(this.prices))
      return []

    let prices = this.prices.filter(p => p.giftOpt == true)

    return prices
  }


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

  getOptionsHavingPrices(): ProductOption[] {

    if (!this.hasOptions())
      return []


    let options = this.options.filter(o => o.hasPrice)

    return options
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

  attachResources(resources: Resource[]): boolean {

    if (ArrayHelper.IsEmpty(resources) || ArrayHelper.IsEmpty(this.resources))
      return false

    let ok = true

    this.resources.forEach(res => {

      if (!res?.resourceId)
        return

      let resource = resources.find(r => r.id == res.resourceId)

      if (!resource) {
        ok = false
        return
      }

      res.resource = resource
    })

    return ok

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

    if (!this.hasOptions() || !optionId)
      return null

    let option = this.options.find(o => o.id == optionId)

    if (option)
      return option


    if (this.hasItems()) {

      let allItemOptions = this.items.flatMap(i => i?.product?.options).filter(o => ObjectHelper.notNullOrUndefined(o))

      if (ArrayHelper.NotEmpty(allItemOptions)) {

        let option = allItemOptions.find(o => o.id == optionId)

        return option
      }
    }

    return null

  }


  getOptionBySlug(optionSlug: string): ProductOption {

    if (!this.hasOptions() || !optionSlug)
      return null

    let option = this.options.find(o => o.slug == optionSlug)

    return option
  }


  getOptionIds(filter?: (input: ProductOption) => boolean): string[] {

    if (!this.hasOptions())
      return []

    let options = this.options

    if (filter) {
      options = options.filter(filter)
    }

    let optionIds = options.map(o => o.id)

    return optionIds
  }


  /*   getOptionIdsHavingDurations(): string[] {
  
      if (!this.hasOptions())
        return []
  
      let optionIds = this.options.filter(o => o.hasDuration && o.addDur).map(o => o.id)
  
      return optionIds
    } */

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
  durationMode: DurationMode = DurationMode.product
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

  /** duo-treatments sometime require a single device/machine that can be shared => the second reservation of this resource can be place after/before the first */
  flex: boolean = false

  /** the second device reservation will be placed AFTER the first if true, otherwise (false) placed BEFORE */
  flexAfter: boolean = true

  /** Durations of selected product options defined in this.optionIds will be added to the duration specified here.
   * Example: there can be a product option 'coaching' with options 0 mins, 15 mins, 30 mins attached to the service 'BodySlimming session'
   * The selected option should not make the service 'BodySlimming session' longer, instead it should result in an extra resource planning with a duration matching the
   * selected product option.
   */
  optionDur: boolean = false

  /** see info on optionDur */
  optionIds?: string[] = []

  /** if true, the duration will be calculated backwards as from this.reference (corrected by offset).
   *  Imagine a service 'BodySlimming session' with a product-option for doing an intake of 20mins (configure by using this.optionDur), 
   * then we want to this intake starting 20mins before the starting of this session.  
   */
  back: boolean = false


  applyToDateRangeSet(dateRangeSet: DateRangeSet): DateRangeSet {

    let result = new DateRangeSet()

    if (!dateRangeSet || dateRangeSet.isEmpty())
      return result


    for (let dateRange of dateRangeSet.ranges) {

      let newDateRange = this.applyToDateRange(dateRange)

      console.warn('applyToDateRangeSet', dateRangeSet)

      result.addRanges(newDateRange)
    }

    return result
  }





  applyToDateRange(dateRange: DateRange): DateRange {

    if (!dateRange)
      return null

    if (this.durationMode != DurationMode.custom)
      throw new Error('Duration mode is not custom, currently not supported!')

    let from = dateRange.from

    if (this.reference == DurationReference.end)
      from = dateRange.to

    from = dateFns.addMinutes(from, this.offset)

    let to = dateFns.addMinutes(from, this.duration)

    let result = new DateRange(from, to)

    return result
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

export enum ProductItemOptionMode {
  /** already pre-selected in ProductItemOption.values */
  'pre' = 'pre',

  /** the customer/user can select this option */
  'cust' = 'cust'
}

export class ProductItemOption {
  id?: string;
  name?: string;

  @Type(() => ProductItemOptionValue)
  values?: ProductItemOptionValue[] = []

  mode: ProductItemOptionMode

  constructor(productOption?: ProductOption) {

    if (!productOption)
      return

    this.id = productOption.id
    this.name = productOption.name

  }

  valueIds(): string[] {

    if (!this.values)
      return []

    return this.values.filter(v => v != null).map(v => v.id)

  }

  valueNames(): string[] {

    if (!this.values)
      return []

    return this.values.filter(v => v != null).map(v => v.name)

  }

  hasValue(): boolean {

    return ArrayHelper.NotEmpty(this.values)

  }

  /*
  getValues(ids: String[]): ProductOptionValue[] {

    if (!Array.isArray(this.values) || !Array.isArray(ids))
      return []

    const values = this.values.filter(v => ids.indexOf(v.id) >= 0)

    return values
  }
    */

}

export class ProductItem extends ObjectWithIdPlus {
  parentId?: string;
  parent?: Product;
  productId?: string;
  product?: Product;
  idx?: number = 0
  name?: string;
  qty?: number = 1

  /** instead of specifying an explicit qty, it can come from a product option (value): specified by optionId */
  optionQty: boolean = false

  /** optional: if optionQty=true, then the selected value of this option will be used for quantity */
  optionId?: string;

  @Type(() => ProductItemOption)
  options?: ProductItemOption[] = []

  hasOptions(): boolean {

    return ArrayHelper.NotEmpty(this.options)

  }


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
  pct = 'pct',   // percentage price change
  add = 'add'   // addition: amount added to the price
}


export enum PriceDateType {
  day = 'day',
  dayFrom = 'dayFrom'
}

/**
 * if price is valid at certain
 *  day: tp='day' and start has format yyyyMMdd
 *  from certain hour at certain day: tp='dayFrom' and start has format yyyyMMddHHmm
 */
export class PriceDate {
  tp: PriceDateType = PriceDateType.day
  start: number
}


export enum PriceConditionType {

  /** Quantity of subscription unit products previously purchased */
  subUnitProdQty = 'subUnitProdQty'
}

export enum ValueComparator {
  '=' = '=',
  '<' = '<',
  '>' = '>',
  '<=' = '<=',
  '>=' = '>='

}

//  '=' | '<' | '>' | '>=' | '<='

export class PriceCondition {

  tp: PriceConditionType

  comp: ValueComparator = ValueComparator["="]

  @Type(() => Number)
  val: number

  ids: string[] = []
}

export class PriceExtraQuantity {
  on: boolean = false
  val: number = 0
  pct: boolean = false
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

  @Type(() => Number)  //initial
  value?: number = 0

  //  @Type(() => Date)

  start?: number | null;

  //  @Type(() => Date)
  end?: number | null;

  qty?: number = 1

  isQty = false
  isDay = false
  days: boolean[] = []

  /** price only valid in [from, to] interval */
  isTime = false

  /** if price is only valid from certain hour during the day, format HH:mm */
  from?: string

  /** if price is only valid to certain hour during the day, format HH:mm */
  to?: string

  /** if price is only valid at certain dates (defined in dates) */
  hasDates = false

  /** if price is only valid at certain dates */
  dates?: PriceDate[]

  @Type(() => PriceExtraQuantity)
  extraQty?: PriceExtraQuantity


  productItemId?: string

  hasOptions = false  // true if this price also has option specific price changes
  options: OptionPrice[] = []

  /** an extra optional price when buying a gift for this product (example wellness is more expensive during peak moments),
   * when buying gift of this product, then customer can select this extra price
   */
  giftOpt = false

  /** price conditions: there was a promotion only if customer previously purchased a certain amount of unit products via previous subscriptions (Bodysculptor) */
  @Type(() => PriceCondition)
  cond: PriceCondition[] = []

  hasPeriods = false
  periods: any

  idx = 0

  /** Skip all next rules */
  skip = false

  /** Skip this rule last 'skipLast' hours, continue with other rules */
  skipLast?: number

  /** Rule is active */
  on = true

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

  get startDate(): Date {

    /** we keep track of a cached verion of the converted date (start to startDate).
     * Reason: UI binding doesn't like to have all the time new Date objects => if start not changed, we return the cached conversion
     */

    if (this._startDate) {

      if (this.start) {
        if (DateHelper.yyyyMMddhhmmss(this._startDate) === this.start)
          return this._startDate
      }
      else
        if (DateHelper.yyyyMMddhhmmss(DateHelper.minDate) === DateHelper.yyyyMMddhhmmss(this._startDate))
          return this._startDate
    }

    if (this.start)
      this._startDate = DateHelper.parse(this.start)
    else
      this._startDate = DateHelper.minDate

    return this._startDate
  }


  set startDate(value: Date | null) {

    if (value) {
      this.start = DateHelper.yyyyMMdd(value) * 1000000  // * 1000000 because we don't care about hhmmss
      this._startDate = null
    }
    else {
      this.start = null
      this._startDate = DateHelper.minDate
    }

  }


  get endDate(): Date {

    /** we keep track of a cached verion of the converted date (start to startDate).
 * Reason: UI binding doesn't like to have all the time new Date objects => if start not changed, we return the cached conversion
 */

    if (this._endDate) {

      if (this.end) {
        if (DateHelper.yyyyMMddhhmmss(this._endDate) === this.end)
          return this._endDate
      }
      else
        if (DateHelper.yyyyMMddhhmmss(DateHelper.maxDate) === DateHelper.yyyyMMddhhmmss(this._endDate))
          return this._endDate
    }

    if (this.end)
      this._endDate = DateHelper.parse(this.end)
    else
      this._endDate = DateHelper.maxDate

    return this._endDate
    /*
    if (!this.end)
      return null

    if (this._endDate && DateHelper.yyyyMMddhhmmss(this._endDate) === this.end)
      return this._endDate

    this._endDate = DateHelper.parse(this.end)
    return this._endDate
*/
  }


  set endDate(value: Date | null) {

    if (value) {
      this.end = DateHelper.yyyyMMdd(value) * 1000000
      this._endDate = null
    }
    else
      this.end = null


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

  set isAddition(value: boolean) {
    this.mode = value ? PriceMode.add : PriceMode.same
  }

  get isAddition() {
    return this.mode == PriceMode.add
  }



  hasConditions() {

    return ArrayHelper.NotEmpty(this.cond)
  }

  get extraQtyOn(): boolean {
    return this.extraQty?.on
  }

  set extraQtyOn(value: boolean) {

    if (value) {
      if (!this.extraQty)
        this.extraQty = new PriceExtraQuantity()

      this.extraQty.on = true
    } else {

      if (this.extraQty)
        this.extraQty.on = false

    }

  }


}
