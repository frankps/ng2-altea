import { BankTransaction, Branch, Contact, DepositMode, Gift, Invoice, Order, OrderLine, OrderType, Organisation, PlanningMode, Product, ProductType, Resource, ResourcePlanning, Subscription } from "ts-altea-model";
import { Exclude, Type, Transform } from "class-transformer";
import 'reflect-metadata';
import { ArrayHelper, ConnectTo, DateHelper, DbObjectCreate, IAsDbObject, ManagedObject, ObjectHelper, ObjectMgmt, ObjectReference, ObjectWithId, ObjectWithIdPlus, QueryOperator, TimeHelper, YearMonth } from 'ts-common'
import * as _ from "lodash";
import { PersonLine } from "../person-line";
import { DateRange, DateRangeSet, TimeBlock, TimeBlockSet, TimeSpan } from "../logic";
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as sc from 'stringcase'
import { OrderPersonMgr } from "../order-person-mgr";
import { CancelOrderMessage } from "ts-altea-logic";


export enum PaymentType {
  cash = 'cash',
  transfer = 'transfer',
  credit = 'credit',
  debit = 'debit',
  gift = 'gift',
  stripe = 'stripe',
  /** subscription */
  subs = 'subs',
  /** loyalty */
  loyal = 'loyal',
}


export class LoyaltyPayInfo {



  constructor(public cardId: string, public rewardId: string) {

  }

}

/** Used for linking Payments to BankTransactions, not in database */
export class PaymentInfo {

  payment: Payment

  info: string

  /** object from provider (Stripe) */
  provider: any

  ok: boolean = true

  static error(payment: Payment, info: string): PaymentInfo {
    let inf = new PaymentInfo()

    inf.ok = false
    inf.payment = payment
    inf.info = info

    return inf
  }
}

export class Payments {
  list: Payment[] = []

  constructor(list: Payment[] = []) {
    this.list = list

  }

  hasPayments() : boolean {
    return ArrayHelper.NotEmpty(this.list)
  }

  add(...pays: Payment[]) {

    if (ArrayHelper.IsEmpty(pays))
      return this

    for (let pay of pays) {
      if (!this.list.find(p => p.id == pay.id))
        this.list.push(pay)
    }

    return this

  }

  orderByDate(): Payment[] {

    if (!this.list)
      this.list = []

    this.list = _.orderBy(this.list, ['date'], ['desc'])
   
    return this.list

  }

  getTotalsByDay(): Map<Date, number> {

    let pays = this.list

    let map = new Map<Date, number>()

    if (ArrayHelper.IsEmpty(pays))
      return map

    let min = _.minBy(pays, 'dateTyped')
    let max = _.maxBy(pays, 'dateTyped')

    let start = dateFns.startOfDay(min.dateTyped)

    while (start <= max.dateTyped) {
      let end = dateFns.addDays(start, 1)

/*       if (start.getDate() == 15)
        console.warn('Day 15') */

      let paysOnDate = pays.filter(p => p.dateTyped >= start && p.dateTyped < end)


      if (ArrayHelper.NotEmpty(paysOnDate)) {
        let sum = _.sumBy(paysOnDate, 'amount')

        if (sum != 0) {
          map.set(start, sum)
        }
      }

      start = end
    }

    return map
  }


  getPaysOnDay(startOfDay: Date): Payment[] {

    let pays = this.list

    let endOfDay = dateFns.addDays(startOfDay, 1)

    let paysOnDate = pays.filter(p => p.dateTyped >= startOfDay && p.dateTyped < endOfDay)

    return paysOnDate
  }

}

export class Payment extends ObjectWithIdPlus {

  static cash(amount: number): Payment {

    const pay = new Payment()
    pay.type = PaymentType.cash
    pay.amount = amount

    return pay
  }

  idx = 0

  @Type(() => Order)
  order?: Order;
  orderId?: string;

  @Type(() => Number)
  amount = 0

  /** fee for provider (ex Stripe) */
  @Type(() => Number)
  fee = 0

  type: PaymentType

  loc: string


  @Type(() => Gift)
  gift?: Gift
  giftId?: string

  @Type(() => Subscription)
  subs?: Subscription
  subsId?: string

  /** id of loyalty card that was used for payment */
  loyalId?: string

  @Type(() => LoyaltyPayInfo)
  loyal?: LoyaltyPayInfo

  @Type(() => BankTransaction)
  bankTx?: BankTransaction
  bankTxId?: string
  bankTxNum?: string

  //date?: Date = new Date()

  @Type(() => Number)
  date?: number; // format: yyyyMMddHHmmss

  info?: string

  /** amount is fully linked to a banktransaction */
  lnk: boolean = false

  /** amount is declared */
  decl: boolean = false

  /** provider id, if payment executed by external provider (example: Stripe payment intent id) */
  provId: string

  constructor() {
    super()

    this.date = DateHelper.yyyyMMddhhmmss()

  }

  declarationPeriod(): number {

    let yearMonth = YearMonth.fromDateNumber(this.date)

    let yearMonthNum = yearMonth.toNumber()

    return yearMonthNum

  }

  amountRounded() {
    return _.round(this.amount, 2)
  }

  @Exclude()
  _dateTyped: Date

  @Exclude()
  get dateTyped(): Date | null {

    if (!this.date)
      return null

    if (this._dateTyped && DateHelper.yyyyMMddhhmmss(this._dateTyped) === this.date)
      return this._dateTyped

    this._dateTyped = DateHelper.parse(this.date)
    return this._dateTyped


  }


  set dateTyped(value: Date | null) {

    if (value) {
      this.date = DateHelper.yyyyMMdd000000(value) + 120000  // 120000= noon
      this._dateTyped = null
    }
    else
      this.date = null

  }



  /*
    @Exclude()
    get dateTyped() {
      return DateHelper.parse(this.date)
    }
  
    changeDate(date: Date) {
      console.log(date)
  
    }
  */
}