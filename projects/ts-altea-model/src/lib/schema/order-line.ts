
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Exclude, Type, Transform } from "class-transformer";
import 'reflect-metadata';
import { ArrayHelper, ConnectTo, DateHelper, DbObjectCreate, IAsDbObject, ManagedObject, NumberHelper, ObjectHelper, ObjectMgmt, ObjectReference, ObjectWithId, ObjectWithIdPlus, QueryOperator, TimeHelper } from 'ts-common'
import * as _ from "lodash";
import { PersonLine } from "../person-line";
import { DateRange, DateRangeSet, TimeBlock, TimeBlockSet, TimeSpan } from "../logic";
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as sc from 'stringcase'
import { OrderPersonMgr } from "../order-person-mgr";
import { CancelOrderMessage } from "ts-altea-logic";
import { Branch, Contact, DepositMode, FormulaTerm, Invoice, Order, OrderType, Organisation, Payment, PaymentType, PlanningMode, Price, PriceMode, Product, ProductItemOption, ProductItemOptionMode, ProductOption, ProductOptionValue, ProductType, Resource, ResourcePlanning, Subscription } from "ts-altea-model";

export class OrderLineOptionSummary {
  /** option name */
  o?: string

  /** value for option */
  v?: string

  toString(): string {
    return `${this.o}: ${this.formatValue()}`
  }

  formatValue(): string {

    if (!this.v)
      return ''

    let value = this.v.replace(',', '.')

    let num = +value

    if (isNaN(num))
      return value
    else
      return '' + _.round(num, 1)
  }

  isZeroOrEmpty() {

    if (!this.v)
      return true

    let value = this.v.replace(',', '.')

    let num = +value

    if (isNaN(num))
      return false
    else
      return num == 0

  }
}

export class OrderLineSummary {
  /** description */
  d?: string;

  /** quantity */
  @Type(() => Number)
  q = 1;

  /** option value summaries */
  @Type(() => OrderLineOptionSummary)
  o?: OrderLineOptionSummary[] = []

  toString(includeOptions = true) {



    let str = `${this.q} x ${this.d}`

    if (includeOptions) {

      let optionStr: string = undefined

      if (ArrayHelper.NotEmpty(this.o)) {
        let options = this.o.filter(o => o && !o.isZeroOrEmpty()).map(o => o.toString())
        optionStr = options.join(', ')
      }

      if (optionStr)
        str += `: ${optionStr}`

    }


    return str
  }
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


    this.setFormula(productOption)

    if (Array.isArray(productOptionValues) && productOptionValues.length > 0) {
      let lineOptionVals = productOptionValues.map(prodVal => new OrderLineOptionValue(prodVal))
      this.values.push(...lineOptionVals)
    }

  }

  optionValues(isPos: boolean): OrderLineOptionValue[] {

    if (!this.hasValues())
      return []

    if (isPos) {
      return this.values
    } else {
      return this.values.filter(v => v.isVisible())
    }

  }


  /** Copy over formula from product option
   * To do: 
   */
  setFormula(productOption?: ProductOption) {
    if (productOption.hasFormula && productOption.formula && productOption.formula.length > 0)
      this.formula = productOption.formula
  }


  static fromProductOption(prodOption: ProductOption, showPrivate: boolean): OrderLineOption {
    const olOption = new OrderLineOption()
    olOption.id = prodOption.id
    olOption.name = prodOption.name

    if (prodOption.hasValues()) {
      olOption.values = prodOption.values.filter(v => showPrivate || !v.pvt).map(value => OrderLineOptionValue.fromProductOptionValue(value))
    }

    return olOption
  }

  /*
  valuesWithNonDefaultValues(): OrderLineOptionValue[] {


  }*/

  hasValues(): boolean {
    return ArrayHelper.NotEmpty(this.values)
  }

  hasValueVal(val: number): boolean {

    if (!this.hasValues())
      return false

    return this.values.findIndex(v => v.val == val) >= 0
  }

  firstValueVal(): number {
    if (!this.hasValues())
      return 0

    return this.values[0].val
  }

  getValueVals(): number[] {
    if (!this.hasValues())
      return []

    return this.values.map(v => v.val)
  }

  getValueValFirst(returnNoValue: number = null): number {
    if (!this.hasValues())
      return returnNoValue

    return this.values[0].val
  }

  hasNonDefaultValues(): boolean {

    if (!this.hasValues())
      return false

    var idx = this.values.findIndex(val => val?.d === false)

    return idx >= 0
  }

  hasAtLeastOne(valueIds: string[]): boolean {

    if (!this.values)
      return false

    var idx = this.values.findIndex(val => valueIds.indexOf(val.id) >= 0)

    return idx >= 0
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

  getValueIds(): string[] {

    if (!this.hasValues())
      return []

    return this.values.map(v => v.id)

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

  /** is default option value (in product config) */
  d = false

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

    this.d = productOptionValue.default

    this.prc = productOptionValue.price
    //this.factor = productOptionValue.factor
  }

  static fromProductOptionValue(prodOptionValue: ProductOptionValue): OrderLineOptionValue {
    const olOptionValue = new OrderLineOptionValue()
    olOptionValue.id = prodOptionValue.id
    olOptionValue.name = prodOptionValue.name
    olOptionValue.dur = prodOptionValue.duration
    olOptionValue.val = prodOptionValue.value
    olOptionValue.d = prodOptionValue.default

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

        if (formulaTerm.value) {

          let val = this.val

          if (formulaTerm.inc)
            val += formulaTerm.inc

          term *= val
        }


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

export enum PriceChangeType {

  /** Change in price of orderline */
  price = 'price',

  /** Change in subscription quantity */
  subsQty = 'subsQty'
}

/**
 *  prices coming from product.prices that are applied to an orderLine
 */
export class PriceChange {

  tp: PriceChangeType = PriceChangeType.price

  /** matching product.price.id */
  id: string

  /** The monetary price change: negative for promotion, positive for extra price (wellness during peak). 
   * Pricechange can also be some other benefit: extra subscription units */
  @Type(() => Number)
  val: number = 0

  /** extra info about this price */
  info: string

  /** if true, then val is a percentage change */
  pct: boolean = false

  /** is a promotion */
  promo: boolean = false

  static new(id: string, val: number, promo: boolean = false, info: string = '') : PriceChange {
    let pc = new PriceChange()
    pc.id = id
    pc.val = val
    pc.promo = promo
    pc.info = info
    return pc
  }

  isPrice() {
    return this.tp == PriceChangeType.price
  }
}


export class OrderLine extends ObjectWithIdPlus {

  idx = 0;

  @Type(() => Order)
  order?: Order;
  orderId?: string;

  /** custom orderlines (such as gifts) may have no associated products */
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

  /** custom price: unit price entered manually or vatPct changed */
  cust: boolean = false

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

  /** custom info: json.subs: contains array of subscriptionIds */
  json: any

  /** Number of customers for this orderline   */
  @Type(() => Number)
  nrPers?: number

  persons?: string[] = []
  tag?: string;

  /** price changes (promotions, flex pricing) coming from product.prices */
  @Type(() => PriceChange)
  pc?: PriceChange[]


  __old_constructor(product?: Product, qty = 1, initOptionValues?: Map<String, String[]>) {
    //super()


    this.qty = qty

    if (!product)
      return


    this.descr = product.name
    this.base = product.salesPricing()
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

      if (ArrayHelper.IsEmpty(optionValues))
        optionValues = option.getDefaultValues()

      if (optionValues) {
        const orderLineOption = new OrderLineOption(option, ...optionValues)
        this.options.push(orderLineOption)
      }

    }

    this.calculateAll()
    console.error(this.incl)
  }



  constructor(product?: Product, qty = 1, initOptionValues?: Map<String, String[]>) {
    super()


    this.qty = qty

    if (!product)
      return


    this.descr = product.name
    this.base = product.salesPricing()
    //this.incl = product.salesPrice
    this.vatPct = product.vatPct
    this.productId = product.id
    this.product = product

    if (!product.options)
      return

    for (const option of product.options) {

      let orderLineOption = this.createOrderLineOption(option, initOptionValues)

      if (orderLineOption)
        this.options.push(orderLineOption)

    }


    /** In case of subscriptions (product has product.items) 
     * 
     *  Be carefull: product.items is used for both subscriptions & bundles
     * 
     */

    if (product.isSubscription() && ArrayHelper.NotEmpty(product.items)) {

      for (let item of product.items) {

        let dependentProduct = item.product

        if (!dependentProduct) {
          console.error('dependent product not loaded!')
          continue
        }

        if (ArrayHelper.IsEmpty(item.options))
          continue

        for (let productItemOption of item.options) {

          let dependentOption = dependentProduct.getOption(productItemOption.id)

          if (!dependentOption) {
            console.error('dependent option not found!')
            continue
          }

          if (productItemOption.mode == ProductItemOptionMode.cust) {

            let orderLineOption = this.createOrderLineOption(dependentOption, initOptionValues)

            if (orderLineOption)
              this.options.push(orderLineOption)

          }

        }
      }


    }

    this.calculateAll()
    console.error(this.incl)
  }

  createOrderLineOption(productOption: ProductOption, initOptionValues?: Map<String, String[]>): OrderLineOption {

    let optionValues: ProductOptionValue[]

    if (initOptionValues && initOptionValues.has(productOption.id)) {
      let valueIds = initOptionValues.get(productOption.id)

      if (Array.isArray(valueIds) && valueIds.length > 0) {

        optionValues = productOption.getValues(valueIds)


      }
    }

    if (!Array.isArray(optionValues) || optionValues.length == 0)
      optionValues = productOption.getDefaultValues(!productOption.multiSelect)

    if (optionValues) {
      const orderLineOption = new OrderLineOption(productOption, ...optionValues)
      return orderLineOption
    }

    return null
  }


  override toString() {

    return `${this.qty} x ${this.descr}`

  }

  optionsWithNonDefaultValues(): OrderLineOption[] {

    if (ArrayHelper.IsEmpty(this.options))
      return []

    var options = this.options.filter(option => option.hasNonDefaultValues())

    return options
  }

  static custom(descr: string, unit: number, vatPct: number): OrderLine {

    const line = new OrderLine()
    line.descr = descr
    line.unit = unit
    line.vatPct = vatPct

    line.calculateInclThenExcl(false)

    return line

  }

  hasOptions(): boolean {
    return (ArrayHelper.NotEmpty(this.options))
  }

  getOptionValues(): OrderLineOptionValue[] {

    if (!this.hasOptions())
      return []

    return this.options.flatMap(o => o.values)

  }

  getOptionValueIds(optionId: string): string[] {

    if (!this.hasOptions())
      return []


    let option = this.options.find(o => o.id == optionId)

    if (!option || !option.hasValues())
      return []

    let valueIds = option.values.filter(v => ObjectHelper.notNullOrUndefined(v)).map(v => v.id)

    return valueIds
  }


  getOptionValueMap(): Map<string, string[]> {

    let map = new Map<string, string[]>()

    if (!this.hasOptions())
      return map

    for (let option of this.options) {
      map.set(option.id, option.getValueIds())
    }

    return map
  }


  getSummary(): OrderLineSummary {
    let summary = new OrderLineSummary()
    summary.d = this.descr
    summary.q = this.qty

    if (this.product && this.product.hasOptions()) {

      for (var option of this.product.options.filter(o => o.prev?.show)) {

        let prefix = option.prev.pre ? option.prev.pre : ''
        let suffix = option.prev.suf ? option.prev.suf : ''

        var orderLineOption = this.getOptionById(option.id)

        if (orderLineOption?.hasValues()) {
          let optionSummary = new OrderLineOptionSummary()
          let values = orderLineOption.values.map(value => `${value.name}`) //  ${prefix} ${suffix}

          // if there's a short name for the option, then we use this
          optionSummary.o = option.short ? option.short : option.name

          optionSummary.v = values.join(', ')
          summary.o.push(optionSummary)

        }
      }

    }


    return summary
  }




  /** sum of product duration and all options */
  totalDuration(): number | null {

    let product = this.product

    if (!this.product)
      return null

    let duration = this.product.duration

    if (product.hasPre)
      duration += product.preTime

    if (product.hasPost)
      duration += product.postTime

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



  /**
   * Product.Prices can contain promotions or prive increases/decreases during certain days, periods.
   * These prices are reflected on the orderLine via priceChanges (orderline.pc[])
   * 
   */



  hasPriceChange(priceId: string): boolean {

    if (ArrayHelper.IsEmpty(this.pc))
      return false

    let idx = this.pc.findIndex(pc => pc.id == priceId)

    return (idx >= 0)

  }

  removePriceChanges(priceId: string) {

    let res = _.remove(this.pc, pc => pc.id == priceId)

    /*     if (ArrayHelper.NotEmpty(res))
          this.calculateAll() */

  }


  applyPrice(price: Price) {

    let priceChange = new PriceChange()

    price.isPromo

    if (price.extraQty?.on) {  // if this is not a 'real' price change, but instead customer receives extra quantity
      priceChange.tp = PriceChangeType.subsQty
      priceChange.val = price.extraQty.val
      priceChange.pct = price.extraQty.pct
    }
    else {
      priceChange.tp = PriceChangeType.price
      priceChange.val = price.value
      priceChange.pct = price.isPercentage
    }

    priceChange.promo = price.isPromo
    priceChange.id = price.id

    priceChange.info = price.title


    this.addPriceChange(priceChange)
  }


  addPriceChange(priceChange: PriceChange, addToEnd: boolean = true) {

    if (!priceChange)
      return

    if (!this.pc)
      this.pc = []

    if (addToEnd)
      this.pc.push(priceChange)
    else
      this.pc.unshift(priceChange)

    //this.calculateAll()

  }

  calculateAll(): number {
    return this.calculateInclThenExcl()
  }

  hasPersons(): boolean {
    return (Array.isArray(this.persons) && this.persons.length > 0)
  }


  /**
   * A product can have 1 or more options used to specify the nr of persons (then option.persons=true)
   * (ex. service Welness has options adults & kids )
   * @returns 
   */
  getNrOfPersonsDefinedOnOptions(): number {

    if (!this.product || !this.product.hasOptions())
      return 1


    var nrOfPersonOptions = this.product.options.filter(o => o.persons == true)

    if (ArrayHelper.IsEmpty(nrOfPersonOptions))
      return 1

    var nrOfPersonOptionIds = nrOfPersonOptions.map(o => o.id)

    var nrOfPersonOptionValues = this.allOptionValues(nrOfPersonOptionIds)

    if (ArrayHelper.IsEmpty(nrOfPersonOptionValues))
      return 1


    var nrOfPersons = _.sumBy(nrOfPersonOptionValues, 'val')

    return nrOfPersons
  }



  /**
   * 
   * @returns this.incl
   */
  calculateInclThenExcl(recalculateUnitPrice: boolean = true): number {


    // this.product.prices

    const previousIncl = this.incl
    const previousExcl = this.excl
    const previousVat = this.vat

    /** a gift orderline can have for instance no product attached */
    if (recalculateUnitPrice && this.product && !this.cust)
      this.setUnitPrice()

    this.incl = this.unit * this.qty

    if (this.vatPct) {
      const vatFactor = (1 + this.vatPct / 100)
      this.excl = NumberHelper.round(this.incl / vatFactor)
      this.vat = NumberHelper.round(this.incl - this.excl)
    } else
      this.excl = this.incl


    if (previousIncl != this.incl) this.markAsUpdated('incl')
    if (previousExcl != this.excl) this.markAsUpdated('excl')
    if (previousVat != this.vat) this.markAsUpdated('vat')

    return this.incl
  }

  setUnitPrice() {

    if (this.cust)
      return

    console.warn('setUnitPrice')


    let previousUnit = this.unit

    this.unit = this.calculateUnitPrice()

    if (previousUnit != this.unit) this.markAsUpdated('unit')

  }

  calculateUnitPrice(startDate?: Date, creationDate?: Date): number {

    let unitPrice = this.base

    if (!this.hasOptions()) {
      return unitPrice
    }

    /**
     * Code introduced for when price of subscription is defined by (options of) containing products (product.items)
     */
    if (this.product.isSubscription() && this.product.hasItems()) {

      for (let productItem of this.product.items) {

        let qty = productItem.qty

        if (productItem.optionQty && productItem.optionId) {
          let qtyOrderLineOption = this.getOptionById(productItem.optionId)

          if (qtyOrderLineOption.hasValues())
            qty = qtyOrderLineOption.values[0].val
        }

        // unitPrice += qty

        let optionPrices = 0

        if (productItem.hasOptions()) {

          for (let productItemOption of productItem.options) {

            let orderLineOption = this.getOptionById(productItemOption.id)

            optionPrices = _.sumBy(orderLineOption.values, 'prc')

            if (optionPrices)
              unitPrice += qty * optionPrices

          }
        }


      }
    }

    // Handle 


    let optionsWithPrice = this.product.getOptionsHavingPrices()
    for (let option of optionsWithPrice) {

      let orderLineOption = this.getOptionById(option.id)

      if (!orderLineOption)
        continue

      for (const orderLineOptionValue of orderLineOption.values) {

        if (option.hasFormula)
          unitPrice += orderLineOptionValue.getPrice(option.formula, this.options)
        else if (option.hasPrice)
          unitPrice += orderLineOptionValue.prc

        // unitPrice += orderLineOptionValue.getPrice(formula, this.options)
        // totalDuration += value.duration
      }
    }

    let bodySculptorAboId = '3a52a26d-6cf7-4f56-bfcc-049d44fd9402'

    if (this.productId == bodySculptorAboId)
      this.doBodySculptorSubscriptionPricing()

    /*
    for (const option of this.options) {
      if (!option.values)
        continue

      for (const orderLineOptionValue of option.values) {
        unitPrice += orderLineOptionValue.getPrice(option.formula, this.options)
        // totalDuration += value.duration
      }
    }
      */

    let priceChange = this.calculatePriceChanges(unitPrice)

    if (priceChange)
      unitPrice += priceChange

    return unitPrice
  }

  doBodySculptorSubscriptionPricing() {

    this.removePriceChanges('bodySculptorSubscription')

    let optionValues = this.getOptionValues()

    if (ArrayHelper.IsEmpty(optionValues))
      return

    let optionValueSum = _.sumBy(optionValues, 'val')

    if (!optionValueSum || optionValueSum < 8)
      return

    console.warn('optionValueSum', optionValueSum)
    /**
     * if number of sessions >= 8: 5 euro discount / session   => priceLevel = 2
     * if number of sessions >= 12: 10 euro discount / session => priceLevel = 3
     * => priceLevel is max 3
     */


    let globalPriceLevel = optionValueSum / 4
    globalPriceLevel = Math.min(globalPriceLevel, 3)  



    let totalDiscount = 0

    for (let option of this.options) {

      let qty = option.firstValueVal()

      if (!qty)
        continue

      let priceLevel = qty / 4

      console.warn('priceLevel', priceLevel)

      let diff = globalPriceLevel - priceLevel

      let discount = diff * qty * 5
      totalDiscount += discount
    }

    

    let priceChange = PriceChange.new('bodySculptorSubscription', -totalDiscount, true, 'BodySculptor Promo')

    // add to beginning of array
    this.addPriceChange(priceChange, false)

    console.warn('totalDiscount', totalDiscount)




  }


  hasPriceChanges(): boolean {
    return ArrayHelper.NotEmpty(this.pc)
  }

  hasSpecialPrices(): boolean {
    return ArrayHelper.NotEmpty(this.product.prices)
  }

  hasPromotions(): boolean {
    if (!this.hasPriceChanges())
      return false

    let idx = this.pc.findIndex(pc => pc.promo === true)

    return idx >= 0
  }

  promotions(): PriceChange[] {

    if (!this.hasPriceChanges())
      return []

    return this.pc.filter(pc => pc.promo == true)
  }


  calculatePriceChanges(unitPrice: number): number {

    if (ArrayHelper.IsEmpty(this.pc))
      return 0

    let totalDelta = 0

    let priceChanges = this.pc.filter(pc => pc.tp == PriceChangeType.price)

    for (const priceChange of priceChanges) {

      let delta = 0

      if (!priceChange.val)
        continue

      if (priceChange.pct) {
        let pct = priceChange.val / 100
        delta += _.round(unitPrice * pct, 2)
      } else {
        delta += _.round(priceChange.val, 2)
      }

      unitPrice += delta
      totalDelta += delta
    }

    return _.round(totalDelta, 2)
  }




  visibleOptions(): OrderLineOption[] {

    return this.options.filter(o => o.values && o.values.findIndex(v => v.isVisible()) >= 0)

  }

  getOptionById(optionId: string): OrderLineOption {

    if (!optionId)
      return null

    let olOption = this.options.find(o => o.id == optionId)
    return olOption
  }

  getOptions(...optionIds: string[]): OrderLineOption[] {

    if (ArrayHelper.IsEmpty(optionIds))
      return []

    let olOptions = this.options.filter(o => optionIds.indexOf(o.id) >= 0)

    return olOptions
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

  allOptionValues(optionIds?: string[]): OrderLineOptionValue[] {

    if (!this.options)
      return []

    const optionValues: OrderLineOptionValue[] = []

    let options = this.options

    if (ArrayHelper.NotEmpty(optionIds))
      options = options.filter(o => optionIds.indexOf(o.id) >= 0)

    for (const option of options) {
      if (option.values && option.values.length > 0)
        optionValues.push(...option.values)
    }

    return optionValues
  }


  /**
   * When subscriptions
   * @returns 
   */
  subscriptionsCreated(): boolean {

    if (!this.json)
      return false

    if (this.json['subs'])
      return true
    else
      return false

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
