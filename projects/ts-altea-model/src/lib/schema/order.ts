/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Exclude, Type, Transform } from "class-transformer";
import 'reflect-metadata';
import { ArrayHelper, ConnectTo, DateHelper, DbObjectCreate, IAsDbObject, ManagedObject, NumberHelper, ObjectHelper, ObjectMgmt, ObjectReference, ObjectWithId, ObjectWithIdPlus, QueryOperator, TimeHelper, YearMonth } from 'ts-common'
import * as _ from "lodash";
import { PersonLine } from "../person-line";
import { DateRange, DateRangeSet, TimeBlock, TimeBlockSet, TimeSpan } from "../logic";
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as sc from 'stringcase'
import { OrderPersonMgr } from "../order-person-mgr";
import { CancelOrderMessage } from "ts-altea-logic";
import { TaxLines, TaxLine, VatLine, Branch, Contact, Currency, DepositMode, Invoice, InvoiceTotals, OrderLine, OrderLineSummary, OrderType, Organisation, Payment, PaymentType, PlanningMode, Product, ProductSubType, ProductType, Resource, ResourcePlanning, Subscription, OrderDeclare } from "ts-altea-model";


//import { numberAttribute } from "@angular/core";



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


export enum OrderState {

  /** during creation: products/services are added, linked to contact, ... */
  creation = 'creation',

  /** when creation has finished */
  created = 'created',

  waitDeposit = 'waitDeposit',
  confirmed = 'confirmed',

  cancelled = 'cancelled',
  //noDepositCancel = 'noDepositCancel',
  // inTimeCancel = 'inTimeCancel',
  // lateCancel = 'lateCancel',

  arrived = 'arrived',
  noShow = 'noShow',
  finished = 'finished',

  inProgress = 'inProgress',
  //  confirmed = 'confirmed',
  //  canceled = 'canceled',
  timedOut = 'timedOut'
}



/** Resource preferences */
export class ResourcePreferences {
  /** list of preferred human resource ids */
  humIds: string[] = []

  /** list of preferred location resource ids */
  locIds: string[] = []
}

export enum CancelBy {
  /** Booking cancelled by customer */
  cust = "cust",

  /** Booking cancelled internally */
  int = "int"
}

export enum CustomerCancelReasons {
  sick = "sick",
  decease = "decease",
  traffic = "traffic",
  work = "work",
  noShow = "noShow",
  noDeposit = "noDeposit",
  inTime = "inTime",  // in time cancel
  late = "late",  // late cancel
  other = "other"
}

export enum InternalCancelReasons {
  absence = "absence",
  techProblem = "techProblem",
  planProblem = "planProblem",
  clean = "clean",  // not finished orders require a cleanup
  other = "other"
}

export enum OrderCancelBy {
  /** customer cancelled order */
  cust = "cust",

  /** order cancelled internally*/
  int = "int"
}

export enum OrderCancelCompensate {
  none = "none",
  gift = "gift"
}

/** The device/location where app was created (needed for deposit handling) */
export enum OrderSource {
  pos = "pos",
  ngApp = "ngApp"
}

export class OrderCancel {
  by?: OrderCancelBy
  reason?: string
  remark?: string
  date?: Date = new Date()
  compensate = OrderCancelCompensate.none
  compensation = 0


  /** return the subscription turns/payments back to customer (if there are any)  */
  returnSubsPayments = false

  set gift(value: boolean) {
    this.compensate = value ? OrderCancelCompensate.gift : OrderCancelCompensate.none
  }

  hasCompensation() {
    return this.compensate != OrderCancelCompensate.none
  }

}



export class Order extends ObjectWithIdPlus implements IAsDbObject<Order> {  // 

  static defaultInclude = ['lines:orderBy=idx', 'contact', 'payments:orderBy=idx', 'planning']   // .product.items
  static jsonProps = ['vatLines', 'persons', 'info', 'sum', 'extIds']

  organisation?: Organisation;
  orgId?: string;

  branch?: Branch;
  branchId?: string;

  @Type(() => Contact)
  contact?: Contact;
  contactId?: string;

  /** name of contact (to reduce external joins with contact table) */
  for?: string

  @Type(() => Invoice)
  invoice?: Invoice;
  invoiceId?: string;

  @Type(() => OrderLine)
  lines?: OrderLine[] = []

  /** short summary of orderlines, stored as json (to reduce external joins with contact table) */
  @Type(() => OrderLineSummary)
  sum?: OrderLineSummary[] = []

  @Type(() => Payment)
  payments?: Payment[] = []

  @Type(() => Subscription)
  subscriptions?: Subscription[];
  // satisfaction?: Satisfaction;

  @Type(() => ResourcePlanning)
  planning?: ResourcePlanning[]

  appointment = false;

  @Type(() => Number)
  start?: number; // format: yyyyMMddHHmmss

  @Type(() => Number)
  end?: number; // format: yyyyMMddHHmmss
  descr?: string;
  type = OrderType.sales

  @Type(() => Number)
  excl = 0;

  @Type(() => Number)
  vat = 0;

  @Type(() => VatLine)
  vatLines?: VatLine[] = []

  @Type(() => TaxLines)
  tax?: TaxLines = new TaxLines()

  @Type(() => Number)
  incl = 0;

  /** deposit is required for this order (default=true): this can be disabled manually by staff or on contact level*/
  depo = true

  /** deposit amount in branch currency */
  @Type(() => Number)
  deposit = 0;

  /** number of minutes within deposit needs to be paid */
  @Type(() => Number)
  depoMins?: number = 60

  @Type(() => Number)
  depoBy?: number  // format: yyyyMMddHHmmss

  @Type(() => Number)
  paid = 0;

  @Type(() => Number)
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

  /** this order is a gift purchase (gift voucher) */
  gift = false;
  giftCode?: string;

  /** messaging (email,sms) to customer enabled */
  msg = true

  msgOn?: number   // format: yyyyMMddhhmmss
  msgCode?: string

  @Type(() => OrderCancel)
  cancel?: OrderCancel

  /** The device/location where app was created (needed for deposit handling) */
  src?: OrderSource = OrderSource.pos

  /** Loyalty is/is not applied for this order */
  loyal: boolean = false

  /** Order needs special attention (use privNote for more details) */
  attn: boolean = false

  /** locked by: during creation, a customer should be able to pick up same time slots (from previous not finished orders),
   * therefor plannings from other orders with same lock (same unique client id) will be ignored
   * we use a client generated guid that is stored in local client storage
   */
  lock?: string = ''

  /** external ids for this order (for instance: used for Stripe payment intends) */
  //extIds?: string[] = []

  constructor(codePrefix?: string, markAsNew = false, createContact: boolean = false) {
    super()

    this.code = this.generateCode(this.cre)

    if (createContact) {
      this.contact = new Contact()
      this.contactId = this.contact.id
    }

    if (markAsNew)
      this.m.n = true
  }


  msgOnDate(): Date | null {

    if (this.msgOn && Number.isInteger(this.msgOn))
      return DateHelper.parse(this.msgOn)
    else
      return null

  }

  createInvoice(): Invoice {
    let invoice = new Invoice()
    invoice.branchId = this.branchId
    invoice.orgId = this.orgId

    let totals = new InvoiceTotals()
    totals.excl = this.excl
    totals.incl = this.incl
    totals.vat = this.vat

    invoice.totals = totals
    invoice.orderCount = 1

    if (this.contact) {
      const contact = this.contact

      invoice.toId = contact.id
      invoice.address = contact.getAddress()

      invoice.company = contact.company
      invoice.vatNum = contact.vatNum
    }


    return invoice
  }

  /**
   * The field product.inform contains extra info that needs to be sent to the customer after a booking
   */
  productInforms(separator: string = '<br>'): string {

    var informs = this.lines.filter(l => l?.product).map(l => l?.product?.inform).filter(inform => inform && inform.length > 0)

    return informs.join(separator)

  }

  depositTime(): string {

    if (Number.isNaN(this.depoMins))
      return ''

    let minutesInDay = 60 * 24

    if (this.depoMins < 60)
      return `de ${this.depoMins} minuten`

    else if (this.depoMins <= minutesInDay) {

      let hours = Math.floor(this.depoMins / 60)

      if (hours == 1)
        return `het uur`
      else
        return `de ${hours} uur`
    }
    else {

      let days = Math.floor(this.depoMins / minutesInDay)

      if (days == 1)
        return `de 24 uur`
      else
        return `de ${days} dagen`

    }

  }

  hasPriceFrom(): boolean {

    if (!this.hasLines())
      return false

    let idx = this.lines.findIndex(l => l.product?.priceFrom)

    return (idx >= 0)

  }

  allPaid(): boolean {
    return this.paid >= this.incl
  }

  depositPaid(): boolean {
    return this.paid >= this.deposit
  }

  depositDate(): string {

    const date = this.depoByDate()

    if (!date)
      return ''

    const short = dateFns.format(date, 'd/M HH:mm')
    return short
  }

  depoByDate(): Date | null {

    if (this.depoBy && Number.isInteger(this.depoBy))
      return DateHelper.parse(this.depoBy)
    else
      return null

  }


  startDateFormat(format: string = 'd/M HH:mm'): string {
    const startDate = this.startDate

    if (!startDate)
      return ''

    const short = dateFns.format(startDate, 'd/M HH:mm')

    return short
  }



  clearMsgCode() {
    this.msgCode = null
    this.msgOn = null
    this.m.setDirty('msgCode', 'msgOn')
  }

  //msgLog: MsgInfo[] = []

  // to remove: use msgOn, msgLog
  /*
  remindOn?: number  // format: yyyyMMddHHmmss
  remindLog?: MsgInfo[]
<i class="fa-solid fa-circle-plus"></i>
<i class="fa-solid fa-credit-card"></i>
<i class="fa-solid fa-circle-check"></i>
<i class="fa-solid fa-pen-circle"></i>
*/



  /** resource preferences for order */
  @Type(() => ResourcePreferences)
  resPrefs?: ResourcePreferences



  /** generate a unique numerical code (can be entered on keypad, phone) */
  generateCode(date: Date = new Date()): string {

    const year = dateFns.format(date, 'yy').substring(1)

    let monthNum = date.getMonth() + 1

    let dayIncrement = 0
    switch (monthNum) {
      case 10:
        monthNum = 0
        break

      case 11:
        dayIncrement = 30
        monthNum = 1
        break

      case 12:
        dayIncrement = 60
        monthNum = 2
        break
    }


    let dayNum = date.getDate()
    dayNum += dayIncrement
    const random = Math.floor(Math.random() * 100)

    const hour = dateFns.format(date, 'HH')

    var code = `${year}${monthNum}${dayNum}${hour}${random}`

    return code

  }




  get startDate(): Date | undefined {
    if (!this.start)
      return undefined

    return DateHelper.parse(this.start)
  }

  set startDate(value: Date) {
    this.start = DateHelper.yyyyMMddhhmmss(value)
  }
  // <i class="fa-regular fa-list"></i>
  stateIcon() {
    switch (this?.state) {
      case OrderState.cancelled: return "fa-solid fa-circle-xmark"
      case OrderState.creation: return "fa-solid fa-pen-circle"
      case OrderState.created: return "fa-regular fa-list"
      case OrderState.waitDeposit: return "fa-solid fa-credit-card"
      case OrderState.confirmed: return "fa-solid fa-circle-check"
      case OrderState.finished: return "fa-sharp-duotone fa-solid fa-flag-checkered"
      default: return undefined
    }
  }

  /*
<i class="fa-sharp-duotone fa-solid fa-flag-checkered"></i>
  */

  stateColor() {
    switch (this?.state) {
      case OrderState.cancelled: return "red"
      case OrderState.creation: return "blue"
      default: return "green"
    }
  }

  calculateDepositByDate(): Date {

    // Thu Apr 18 2024 10:10:46 GMT+0200 (Central European Summer Time)
    // Thu Apr 18 2024 10:19:21 GMT+0200 (Central European Summer Time)

    if (_.isNumber(this.depoMins))
      return dateFns.addMinutes(this.cre, this.depoMins)

    return this.cre
  }

  setDepositBy() {
    this.depoBy = DateHelper.yyyyMMddhhmmss(this.calculateDepositByDate())
  }

  calculateCancelCompensation(cancelBy: OrderCancelBy): number {

    if (ArrayHelper.IsEmpty(this.payments)) {
      return 0
    }

    let compensation = 0

    let totalActualPaid = this.totalPaidNotOfType(PaymentType.gift, PaymentType.subs)

    if (cancelBy == OrderCancelBy.cust) {  // then we keep the deposit amount    // && this.message == CancelOrderMessage.noMoreFreeCancel
      compensation = totalActualPaid - this.deposit
    } else {
      compensation = totalActualPaid
    }

    if (compensation < 0)
      compensation = 0

    return compensation
  }


  asDbObject(): DbObjectCreate<Order> {
    return new DbObjectCreate<Order>('order', Order, this)
  }

  clone(): Order {

    return ObjectHelper.clone(this, Order)
  }

  isEmpty(): boolean {
    return !this.hasLines()
  }

  totalPaidNotOfType(...exclusive: PaymentType[]): number {

    if (ArrayHelper.IsEmpty(this.payments))
      return 0

    // we do not return on gift payments or subscriptions
    let actualPayments = this.payments.filter(p => exclusive.indexOf(p.type) == -1)

    if (ArrayHelper.IsEmpty(actualPayments))
      return 0

    const totalPaid = _.sum(actualPayments.map(p => p.amount))

    return totalPaid
  }

  paymentsOfType(...types: PaymentType[]): Payment[] {

    if (ArrayHelper.IsEmpty(this.payments))
      return []

    let payments = this.payments.filter(p => types.indexOf(p.type) >= 0)

    return payments

  }

  hasServices(): boolean {
    if (!this.hasLines())
      return false

    const firstSvc = this.lines.findIndex(l => l.product?.type == ProductType.svc)

    return firstSvc >= 0
  }

  hasPersons(): boolean {
    return (Array.isArray(this.persons) && this.persons.length > 0)
  }

  hasLines(): boolean {
    return (Array.isArray(this.lines) && this.lines.length > 0)
  }

  productIds(): string[] {
    if (ArrayHelper.IsEmpty(this.lines))
      return []

    return this.lines.map(l => l.productId)
  }


  sumToString(includeOptions = true, separator: string = '\<br>\n'): string {

    if (ArrayHelper.IsEmpty(this.sum))
      return ''


    const lines = this.sum.map(lineSum => lineSum.toString(includeOptions))

    let res: string = lines.join(separator)

    return res
    /*
    if (ArrayHelper.IsEmpty(this.lines))
      return ''

    const lines = this.lines.map(line => line.toString())

    let res: string = lines.join('<br>/n')

    return res
    */
  }


  hasPlanningLines(): boolean {
    if (!this.hasLines())
      return false


    return this.lines.findIndex(l => l.product?.type == ProductType.svc) >= 0
  }

  hasTaxLines(): boolean {
    return ArrayHelper.NotEmpty(this.tax?.lines)
  }

  nrOfLines(): number {
    if (!Array.isArray(this.lines))
      return 0

    return this.lines.length

  }

  nrOfPayments(): number {
    if (!Array.isArray(this.payments))
      return 0

    return this.payments.length

  }

  getLine(orderLineId: string): OrderLine | undefined {

    return this.lines?.find(l => l.id == orderLineId)
  }

  getLineByProduct(productId: string): OrderLine | undefined {

    return this.lines?.find(l => l.productId == productId)
  }

  getPaymentsAfter(dateNum: number, excludeTypes?: PaymentType[]): Payment[] {

    if (!this.hasPayments())
      return []

    let pays = this.payments.filter(p => p.date >= dateNum)

    if (ArrayHelper.NotEmpty(excludeTypes)) {
      pays = pays.filter(p => excludeTypes.indexOf(p.type) == -1)
    }

    return pays
  }

  getPaymentsByType(type: PaymentType): Payment[] {

    if (ArrayHelper.IsEmpty(this.payments))
      return []


    return this.payments.filter(pay => pay.type == type)

  }

  getPaymentsBetween(start: number, end: number, types: PaymentType[]) {
    let pays = this.payments.filter(p => p.date >= start && p.date < end && types.indexOf(p.type) >= 0)
    return pays
  }

  getPaymentsByTypes(...types: PaymentType[]): Payment[] {

    if (ArrayHelper.IsEmpty(this.payments))
      return []

    return this.payments.filter(pay => types.indexOf(pay.type) >= 0)
  }

  getPaymentsNotOfTypes(...types: PaymentType[]): Payment[] {

    if (ArrayHelper.IsEmpty(this.payments))
      return []

    return this.payments.filter(pay => types.indexOf(pay.type) == -1)
  }


  getOrderLinesWithSpecialPricing(): OrderLine[] {

    if (!this.hasLines())
      return []

    let specialPriceLines = this.lines.filter(l => l.hasSpecialPrices())

    return specialPriceLines

  }

  /**
   * The default cancel time is defined on branch (branch.cancel in hours = number of hours before start of booking where free cancellation is not allowed anymore)
   * Products can optionally specify another minimum interval
   * 
   * Make sure to have branch and products loaded!
   * 
   * @returns 
   */
  cancelMinHours(): number {
    const products = this.getProducts()

    if (ArrayHelper.IsEmpty(products))
      return 0

    const defaultBranchCancel = this.branch.cancel ?? 0

    const allCancelHours = products.map(p => p?.cancel ?? defaultBranchCancel)

    const cancelHours = _.max(allCancelHours)

    return cancelHours
  }

  /**
   * 
   * @param payment 
   * @param newPayment false introduced for cut/paste payments from other orders
   */
  addPayment(payment: Payment, newPayment: boolean = true) {

    if (!payment)
      return

    if (!this.payments)
      this.payments = []

    this.payments.push(payment)

    if (newPayment) {
      payment.idx = this.nextPaymentIdx()
      payment.markAsNew()

    } else {
      payment.markAsUpdated('orderId')
      payment.orderId = this.id

      if (payment.order)
        payment.order = this
    }





    this.makePayTotals()
  }

  sortPayments() {

    if (!this.hasPayments())
      return

    this.payments = _.orderBy(this.payments, ['date'])
  }

  hasPayments(): boolean {
    return (Array.isArray(this.payments) && this.payments.length > 0)
  }

  toPay(): number {
    return _.round(this.incl - this.paid, 2)
  }


  makePayTotals() {

    let totalPaid = 0

    console.warn(this.payments)

    if (Array.isArray(this.payments))
      totalPaid = _.sumBy(this.payments, 'amount');

    totalPaid = _.round(totalPaid, 2)
    console.error(totalPaid)

    if (totalPaid != this.paid) {
      this.paid = totalPaid
      this.markAsUpdated('paid')
    }

    return totalPaid


  }

  nextPaymentIdx() {
    return ObjectHelper.nextIdx(this.payments)
  }

  nextOrderLineIdx() {
    return ObjectHelper.nextIdx(this.lines)
  }

  addLine(orderLine: OrderLine, setUnitPrice = true) {

    if (!orderLine)
      return

    orderLine.idx = this.nextOrderLineIdx()

    if (!this.lines)
      this.lines = []

    orderLine.order = this

    if (setUnitPrice)
      orderLine.setUnitPrice()

    this.lines.push(orderLine)

    /** inside the order (stored as json), we keep track of a short summary of this orderline */
    let summary = orderLine.getSummary()

    if (!this.sum)
      this.sum = []

    this.sum.push(summary)
    this.markAsUpdated('sum')

    orderLine.markAsNew()

    this.calculateAll()
  }

  /** in order.sum, we keep track of a short summary of all orderlines (stored as json) */
  refreshSummary() {

    this.sum = []
    this.markAsUpdated('sum')

    if (!this.hasLines())
      return

    for (let line of this.lines) {
      const summary = line.getSummary()
      this.sum.push(summary)
    }

  }

  deleteLine(orderLine: OrderLine): boolean {

    if (!this.lines || !orderLine)
      return false

    const removed = _.remove(this.lines, l => l.id == orderLine.id)

    if (Array.isArray(removed) && removed.length > 0 && !orderLine.m.n)  // orderLine.m.n = it was a new line not yet saved in backend
      this.markAsRemoved('lines', orderLine.id)

    this.calculateAll()
    this.refreshSummary()

    return (Array.isArray(removed) && removed.length > 0)
  }


  setBackLinks() {

    if (ArrayHelper.NotEmpty(this.lines)) {
      this.lines.forEach(line => {
        line.order = this
      })
    }
  }


  removeBackLinks() {

    if (ArrayHelper.NotEmpty(this.lines)) {
      this.lines.forEach(line => {
        line.order = undefined
      })
    }

  }

  clearAllPriceChanges() {

    if (!this.hasLines())
      return

    this.lines.forEach(line => line.pc = [])

  }

  calculateAll() {

    console.warn('calculateAll')

    this.setBackLinks()

    this.makeLineTotals()
    this.calculateVat()

    const deposit = this.calculateDeposit()

    if (deposit != this.deposit) {
      this.deposit = deposit
      this.markAsUpdated('deposit')
    }

    this.removeBackLinks()
  }


  calculateDeposit(): number {

    console.error('calculateDeposit')

    /** deposit behavior can be overruled on contact level */
    if (this.contact) {

      switch (this.contact.deposit) {
        case undefined:
        case DepositMode.default:
          // just continue with normal calculation  
          // this.depo = true
          break

        case DepositMode.none:
          this.depo = false
          break  // we will calculate deposit further below, but it will not be requested!

        case DepositMode.full:
          // this.depo = true
          return this.incl
      }
    }

    if (!this.hasLines() || this.incl == 0)
      return 0

    if (!this.branch)
      throw new Error('branch not found on order (order.branch missing)!')

    if (this.gift)
      return this.incl

    const defaultDepositPct = this.branch.depositPct ?? 0

    let deposit = 0

    for (let line of this.lines) {

      let depositPct = 100

      if (line?.product?.type == ProductType.svc)
        depositPct = line?.product?.depositPct ?? defaultDepositPct

      if (depositPct == 0)
        continue

      depositPct = depositPct / 100

      let depositValue = line.incl * depositPct
      deposit += depositValue
    }

    deposit = Math.round(deposit)

    this.deposit = deposit



    return deposit
  }


  hasVatLines(atLeast: number = 1): boolean {

    if (!Array.isArray(this.vatLines))
      return false

    let length = this.vatLines.length

    return length >= atLeast
  }

  totalVatIncl() {
    if (!this.vatLines)
      return 0

    return _.sumBy(this.vatLines, 'incl')
  }

  /** In case there is a negative orderLine with VAT% of 0, we will reduce existing vat starting with highest values,
   * returns the amount reduced
   */
  reduceVat(vatMap: Map<number, VatLine>, amountIncl: number): number {

    if (!vatMap || !amountIncl)
      return 0

    let vatPctgs = Array.from(vatMap.keys())

    if (ArrayHelper.IsEmpty(vatPctgs))
      return 0

    vatPctgs = _.sortBy(vatPctgs, [], 'desc')

    let stillToReduce = amountIncl

    for (let vatPctg of vatPctgs) {
      let vatLine = vatMap.get(vatPctg)

      let amountInclToReduceFromLine = stillToReduce

      if (amountInclToReduceFromLine > vatLine.incl)
        amountInclToReduceFromLine = vatLine.incl

      let excl = _.round(amountInclToReduceFromLine / (1 + vatPctg / 100), 2)
      let vat = amountInclToReduceFromLine - excl

      vatLine.incl = _.round(vatLine.incl - amountInclToReduceFromLine, 2)
      vatLine.vat = _.round(vatLine.vat - vat, 2)
      vatLine.excl = _.round(vatLine.excl - excl, 2)

      stillToReduce = _.round(stillToReduce - amountInclToReduceFromLine, 2)

      if (stillToReduce == 0)
        return amountIncl

    }

    let amountReduced = _.round(amountIncl - stillToReduce, 2)
    return amountReduced
  }

  calculateVat() {

    console.warn('calculateVat')

    if (!this.hasLines())
      this.vatLines = []

    const vatMap = new Map<number, VatLine>()


    let totalVat = 0, totalExcl = 0, totalIncl = 0

    /** we want to treat the 0 pct lines at the end */
    let orderLines = _.orderBy(this.lines, ['vatPct'], ['desc'])

    for (let orderLine of orderLines) {

      if (!orderLine) // || !orderLine.vatPct || orderLine.vatPct === 0
        continue

      let vatPct = orderLine.vatPct

      if (!orderLine.vatPct)  // in case of null or undefined
        vatPct = 0

      let doVat = true

      if (vatPct == 0 && orderLine.incl < 0) {
        let toReduce = Math.abs(orderLine.incl)
        this.reduceVat(vatMap, toReduce)
        doVat = false
      }

      if (doVat) {

        let vatLine: VatLine

        if (vatMap.has(vatPct))
          vatLine = vatMap.get(vatPct)
        else {
          vatLine = new VatLine(vatPct, 0, 0, 0)
          vatMap.set(vatPct, vatLine)
        }
  
        vatLine.vat += orderLine.vat
        vatLine.excl += orderLine.excl
        vatLine.incl += orderLine.incl
      }



      totalVat += orderLine.vat
      totalExcl += orderLine.excl
      totalIncl += orderLine.incl
    }

    let calculatedVatLines = Array.from(vatMap.values())
    calculatedVatLines = _.sortBy<VatLine>(calculatedVatLines, 'pct')

    for (let vatLine of calculatedVatLines) {
      vatLine.vat = _.round(vatLine.vat, 2)
      vatLine.excl = _.round(vatLine.excl, 2)
      vatLine.incl = _.round(vatLine.incl, 2)
    }

    if (!this.vatLinesSame(this.vatLines, calculatedVatLines)) {
      this.vatLines = calculatedVatLines
      this.markAsUpdated('vatLines')
    }


    let origVat = this.vat
    let origExcl = this.excl
    let origIncl = this.incl

    totalVat = _.round(totalVat, 2)
    totalExcl = _.round(totalExcl, 2)
    totalIncl = _.round(totalIncl, 2)


    if (this.vat != totalVat) {
      this.vat = totalVat
      this.markAsUpdated('vat')
    }


    if (this.excl != totalExcl) {
      this.excl = totalExcl
      this.markAsUpdated('excl')
    }


    if (this.incl != totalIncl) {
      this.incl = totalIncl
      this.markAsUpdated('incl')
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

    let incl = 0, excl = 0, vat = 0

    for (const line of this.lines) {

      line.calculateInclThenExcl()

      vat += line.vat
      incl += line.incl
      excl += line.excl
    }

    vat = NumberHelper.round(vat)
    incl = NumberHelper.round(incl)
    excl = NumberHelper.round(excl)

    if (incl != this.incl) {
      this.incl = incl
      this.markAsUpdated('incl')
    }

    if (vat != this.vat) {
      this.vat = vat
      this.markAsUpdated('vat')
    }

    if (excl != this.excl) {
      this.excl = excl
      this.markAsUpdated('excl')
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

  deleteAllPlannings() {

    if (ArrayHelper.NotEmpty(this.planning)) {
      // inform back-end that plannings should be removed
      this.planning.forEach(plan => this.markAsRemoved('planning', plan.id))

      // remove client-side planning
      this.planning = []
    }
  }

  addPlanning(...planning: ResourcePlanning[]) {

    if (ArrayHelper.IsEmpty(planning))
      return

    planning.forEach(plan => plan.markAsNew())

    if (!this.planning)
      this.planning = []

    this.planning.push(...planning)

  }

  getProductIds(): string[] {

    if (!this.hasLines())
      return []

    const productIds = this.lines!.filter(l => l.productId).map(l => l.productId!)

    return productIds
  }

  getNotLoadedProductIds(): string[] {

    if (!this.hasLines())
      return []

    const productIds = this.lines!.filter(l => !l.product && l.productId).map(l => l.productId!)

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
   *  Do not use anymore, because line.product.resources.resource can be OLD version
   *  use getProductResourceIds(), and then fetch resources! Otherwise you may get an 'old' cached version of that resource
   * 
   * */
  /*
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
    */


  getAllResourceIds(): string[] {

    let resourceIds = this.lines.flatMap(line => line.product.resources.map(pr => pr.resourceId))

    resourceIds = _.uniq(resourceIds)

    return resourceIds
  }


  /** Gets the resources that are defined in the configuration for all products (used in this order)   
 * 
 *      order.lines[x].product.resources[y].resource 
 * 
 * */
  /*
    getConfigResourceGroups(): Resource[] {
  
      const configResources = this.getProductResources()
      return configResources.filter(r => r.isGroup)
  
    }
  */

  getResources(): Resource[] {

    if (ArrayHelper.IsEmpty(this.planning))
      return []

    let resources: Resource[] = []


    for (const planning of this.planning) {

      if (!(planning.resource))
        continue

      if (resources.findIndex(r => r.id == (planning.resource as Resource)?.id) >= 0)
        continue

      resources.push(planning.resource as Resource)
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

    const personSelectLines = this.lines?.filter(ol => ol.product?.type == ProductType.svc && ol.product?.personSelect)

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
    const planningLine = this.lines?.find(ol => ol.product.type == ProductType.svc &&
      ol.product.sub == ProductSubType.basic && ol.product?.planMode != PlanningMode.none)  // .hasResources()

    return planningLine ? true : false
  }


  linesWithPlanning(): OrderLine[] {

    if (!this.lines || this.lines.length == 0)
      return []

    const orderlinesWithPlanning = this.lines?.filter(ol => ol.product.type == ProductType.svc
      && ol.product?.planMode != PlanningMode.none) // .hasResources()
    return orderlinesWithPlanning
  }


  /** returns vat% most used in this order (highest line values) */
  dominantVatPct(fallbackPct: number): number {
    if (!this.hasVatLines())
      return fallbackPct

    let ordered = _.orderBy(this.vatLines, ['incl'], ['desc'])

    return ordered[0].pct
  }


  /**
   * 
   * @param closedUntil last closed month (=> up to this point fixed)
   */
  calculateTax(closedUntil: YearMonth) {

    let orderDeclare = OrderDeclare.init(this, this.vatLines)

    //  let taxAlreadyDeclared = this.tax.getLinesGroupedByPct(closedUntil)

    if (this.tax) {
      let taxAlreadyDeclared = this.tax.getLinesUntil(closedUntil.toNumber())

      if (taxAlreadyDeclared?.hasLines())
        orderDeclare.setAlreadyDeclared(taxAlreadyDeclared)

    } else {
      this.tax = new TaxLines()
    }

    let firstDayNextMonth = closedUntil.firstDayNextMonth()

    let newPays = this.getPaymentsAfter(firstDayNextMonth, [PaymentType.subs, PaymentType.loyal])


    /* Also filter out gift payments where the gift was already declared (because gift was invoiced or OLD gift)
    */
    newPays = newPays.filter(p => p.type != PaymentType.gift || (p.type == PaymentType.gift && !p.gift.decl))

    let positivePays = newPays.filter(p => p.amount > 0)
    let negativePays = newPays.filter(p => p.amount < 0)

    let declarePositiveResult = orderDeclare.declarePositive(positivePays)
    let declareNegativeResult = orderDeclare.declareNegative(negativePays)

    if (declarePositiveResult.isOk()) {

      let updateFrom = closedUntil.next()
      let yyMM = updateFrom.toNumber()
      orderDeclare.updateLines(this.tax, yyMM)
      //.updateLines(yyMM, orderDeclare)

      this.markAsUpdated('tax')

    }

  }


}
