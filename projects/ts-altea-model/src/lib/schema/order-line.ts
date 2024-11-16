
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
import { Branch, Contact, DepositMode, FormulaTerm, Invoice, Order, OrderType, Organisation, Payment, PaymentType, PlanningMode, PriceMode, Product, ProductOption, ProductOptionValue, ProductType, Resource, ResourcePlanning, Subscription } from "ts-altea-model";

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
      return '' + _.round(num)
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

  /** Copy over formula from product option
   * To do: 
   */
  setFormula(productOption?: ProductOption) {
    if (productOption.hasFormula && productOption.formula && productOption.formula.length > 0)
      this.formula = productOption.formula
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

  /*
  valuesWithNonDefaultValues(): OrderLineOptionValue[] {


  }*/

  hasValues(): boolean {
    return ArrayHelper.NotEmpty(this.values)
  }

  hasNonDefaultValues(): boolean {

    if (!this.hasValues())
      return false

    var idx = this.values.findIndex(val => val?.d === false)

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

  persons?: string[] = []
  tag?: string;



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

    line.calculateInclThenExcl()

    return line

  }

  hasOptions(): boolean {
    return (ArrayHelper.NotEmpty(this.options))
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

  calculateAll() {
    this.setUnitPrice()
    this.calculateInclThenExcl()
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
  calculateInclThenExcl(): number {


    // this.product.prices

    const previousIncl = this.incl
    const previousExcl = this.excl
    const previousVat = this.vat

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

    console.warn('makeTotals')

    let previousUnit = this.unit

    let unitPrice = this.base

    if (ArrayHelper.IsEmpty(this.options)) {
      this.unit = unitPrice
      if (previousUnit != this.unit) this.markAsUpdated('unit')
      return
    }

    for (const option of this.options) {
      if (!option.values)
        continue

      for (const orderLineOptionValue of option.values) {
        unitPrice += orderLineOptionValue.getPrice(option.formula, this.options)
        // totalDuration += value.duration
      }
    }

    this.unit = this.applySpecialPricing(unitPrice)
    if (previousUnit != this.unit) this.markAsUpdated('unit')

  }

  applySpecialPricing(unit: number): number {

    if (ArrayHelper.IsEmpty(this.product.prices))
      return unit

    for (let price of this.product.prices) {

      if (price.isDay) {
        let startDay = this.order?.startDate

        let day = dateFns.getDay(startDay)

        if (!price.days[day])
          continue
      }

      switch (price.mode) {
        case PriceMode.add:
          unit += price.value
          break
      }
    }

    return unit


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
