

import { Branch, Contact, DepositMode, Gender, Gift, LoyaltyCard, Order, OrderLine, OrderType, Organisation, PlanningMode, Product, ProductResource, ProductType, ResourcePlanning, Schedule, Subscription, User, UserBase, VatLine } from "ts-altea-model";
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




export enum InvoiceState {
  toInvoice = 'toInvoice',
  invoiced = 'invoiced',
  onHold = 'onHold'
}

export class InvoiceTotals {
  excl: number = 0
  incl: number = 0
  vat: number = 0
}

export class Invoice extends ObjectWithIdPlus {


  @Type(() => Order)
  orders?: Order[];

  orderCount: number = 0

  state: InvoiceState = InvoiceState.toInvoice

  orgId?: string
  branchId?: string

  @Type(() => Contact)
  to?: Contact;
  toId?: string;
   
  num?: string;

  company?: string
  vatNum?: string
  country?: string = 'BEL'
  address?: string

  email?: string

  date?: number

  @Type(() => InvoiceTotals)
  totals?: InvoiceTotals = new InvoiceTotals()

  @Type(() => VatLine)
  vatLines?: VatLine[] = []

  /** use alternate message instead of default */
  useAlter: boolean = false

  /** alternative message for on invoice */
  alter?: string

  constructor() {
    super()

    this.typedDate = new Date()
  }

  @Exclude()
  _typedDate?: Date

  @Exclude()
  /** last date used to check if we need to parse the date again */
  _lastDate?: number

  @Exclude()
  get typedDate(): Date | undefined {
    if (!this.date)
      return undefined

    if (this._typedDate && this._lastDate === this.date)
      return this._typedDate

    this._typedDate = DateHelper.parse(this.date)
    this._lastDate = this.date
    return this._typedDate
  }

  set typedDate(value: Date) {
    this._typedDate = value
    this.date = DateHelper.yyyyMMdd(value)
  }

  hasOrders(): boolean {
    return ArrayHelper.NotEmpty(this.orders)
  }

  hasVatLines(): boolean {
    return ArrayHelper.NotEmpty(this.vatLines)
  }

  addressHtml(): string {
    return this.address ? this.address.replace(/\n/g, '<br>') : ''
  }

  isConsistent(): boolean {
    //return this.totals && this.vatLines && this.totals.excl === this.vatLines.reduce((acc, vatLine) => acc + vatLine.excl, 0)

    if (!this.totals)
      this.totals = new InvoiceTotals()

    if (!this.vatLines)
      this.vatLines = []

    // check vat lines

    let vatLinesExcl = this.vatLines.reduce((acc, vatLine) => acc + vatLine.excl, 0)
    vatLinesExcl = _.round(vatLinesExcl, 2) 
    let vatLinesIncl = this.vatLines.reduce((acc, vatLine) => acc + vatLine.incl, 0)
    vatLinesIncl = _.round(vatLinesIncl, 2)
    let vatLinesVat = this.vatLines.reduce((acc, vatLine) => acc + vatLine.vat, 0)
    vatLinesVat = _.round(vatLinesVat, 2)
    let calculatedVat = _.round(vatLinesIncl - vatLinesExcl, 2)

    let vatLinesOk = this.totals.excl === vatLinesExcl && this.totals.incl === vatLinesIncl && this.totals.vat === vatLinesVat && this.totals.vat === calculatedVat

    // check order lines

    let orderLines = this.orders?.flatMap(o => o.lines) ?? []

    let orderLinesExcl = orderLines.reduce((acc, line) => acc + line.excl, 0)
    orderLinesExcl = _.round(orderLinesExcl, 2)
    let orderLinesIncl = orderLines.reduce((acc, line) => acc + line.incl, 0)
    orderLinesIncl = _.round(orderLinesIncl, 2)
    let orderLinesVat = orderLines.reduce((acc, line) => acc + line.vat, 0)
    orderLinesVat = _.round(orderLinesVat, 2)
    let calculatedOrderVat = _.round(orderLinesIncl - orderLinesExcl, 2)

    let orderLinesOk = this.totals.excl === orderLinesExcl && this.totals.incl === orderLinesIncl && this.totals.vat === orderLinesVat && this.totals.vat === calculatedOrderVat

    console.warn(calculatedVat)

    return vatLinesOk && orderLinesOk
  }

  updateFromOrders() {

    if (!this.hasOrders())
      return
    
    let vatLines: VatLine[] = []

    for (let order of this.orders.filter(o => o.hasVatLines())) {
      
      for (let vatLine of order.vatLines) {

        let invoiceVatLine = vatLines.find(vl => vl.pct === vatLine.pct)

        if (invoiceVatLine) {
          invoiceVatLine.vat += _.round(vatLine.vat, 2)
          invoiceVatLine.excl += _.round(vatLine.excl, 2)
          invoiceVatLine.incl += _.round(vatLine.incl, 2)
        } else {
          vatLines.push(vatLine.clone())
        }
      }
    }

    /** calculate totals */

    let totalExcl = 0, totalIncl = 0, totalVat = 0

    for (let vatLine of vatLines) {

      vatLine.vat = _.round(vatLine.vat, 2)
      vatLine.excl = _.round(vatLine.excl, 2)
      vatLine.incl = _.round(vatLine.incl, 2)

      totalExcl += vatLine.excl
      totalIncl += vatLine.incl
      totalVat += vatLine.vat
    }

    this.totals.excl = _.round(totalExcl, 2)
    this.totals.incl = _.round(totalIncl, 2)
    this.totals.vat = _.round(totalVat, 2)

    this.vatLines = vatLines

    this.markAsUpdated('totals')
    this.markAsUpdated('vatLines')

  }


}
