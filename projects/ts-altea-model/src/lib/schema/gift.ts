
import { Branch, Contact, DepositMode, Invoice, Order, OrderLine, OrderLineOption, OrderLineOptionValue, OrderType, Organisation, PlanningMode, Product, ProductResource, ProductType, ResourcePlanning, Schedule, TimeUnit, User } from "ts-altea-model";
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
  @Type(() => GiftVatPct)
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

export enum GiftType {
  // none = 'none', // when nothing is selected yet
  amount = 'amount',
  specific = 'specific',
  /*   prod = 'prod',
    svc = 'svc' */
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


export class GiftLineOptionValue {
  id?: string
  name?: string
  prc = 0
  val = 0

  constructor(id?: string, name?: string, prc = 0, val = 0) {

    this.id = id
    this.name = name
    this.prc = prc
    this.val = val
  }

  static fromOrderLineOptionValue(olOptVal: OrderLineOptionValue): GiftLineOptionValue {
    let giftLineOptionValue = new GiftLineOptionValue(olOptVal.id, olOptVal.name, olOptVal.prc, olOptVal.val)
    return giftLineOptionValue
  }

  sync(olOptVal: OrderLineOptionValue) {
    this.name = olOptVal.name
    this.prc = olOptVal.prc
    this.val = olOptVal.val
  }

}

export class GiftLineOption {
  id?: string
  name?: string

  @Type(() => GiftLineOptionValue)
  vals: GiftLineOptionValue[] = []

  constructor(id?: string, name?: string) {

    this.id = id
    this.name = name
  }

  static fromOrderLineOption(orderLineOption: OrderLineOption): GiftLineOption {

    let giftLineOption = new GiftLineOption(orderLineOption.id, orderLineOption.name)

    if (ArrayHelper.NotEmpty(orderLineOption.values)) {

      for (let olOptionValue of orderLineOption.values) {
        let giftLineOptionValue = GiftLineOptionValue.fromOrderLineOptionValue(olOptionValue)
        giftLineOption.vals.push(giftLineOptionValue)
      }

    }

    return giftLineOption
  }

  getOptionValue(optionValueId: string): GiftLineOptionValue {

    if (ArrayHelper.IsEmpty(this.vals))
      return undefined

    return this.vals.find(val => val.id == optionValueId)

  }


  sync(olOption: OrderLineOption) {

    if (ArrayHelper.IsEmpty(olOption.values)) {
      this.vals = []
      return
    }

    for (let olOptValue of olOption.values) {

      let giftLineOptionValue = this.getOptionValue(olOptValue.id)

      if (!giftLineOptionValue) {
        let giftLineOptionValue = GiftLineOptionValue.fromOrderLineOptionValue(olOptValue)
        this.vals.push(giftLineOptionValue)
      } else {
        giftLineOptionValue.sync(olOptValue)
      }

    }

    // remove values that were also remove from order
    const valueIdsToRemove = []
    for (let giftLineOptValue of this.vals) {

      let olOptValue = olOption.getValueById(giftLineOptValue.id)
      if (!olOptValue)
        valueIdsToRemove.push(giftLineOptValue.id)

    }

    if (valueIdsToRemove.length > 0)
      _.remove(this.vals, val => valueIdsToRemove.indexOf(val.id) >= 0)

  }




}


/** GiftLine is a reduced version of an orderLine.
 *  It is used for specific gift (products/services are gifted) instead of an amount.
 *  
 */
export class GiftLine {

  id: string

  qty = 1
  prc = 0

  /** product id */
  pId?: string

  /** options */
  @Type(() => GiftLineOption)
  opts: GiftLineOption[] = []

  descr?: string

  static fromOrderLine(orderLine: OrderLine): GiftLine {

    if (!orderLine)
      return null

    let giftLine = new GiftLine()

    giftLine.id = orderLine.id
    giftLine.qty = orderLine.qty
    giftLine.prc = orderLine.incl
    giftLine.pId = orderLine.productId
    giftLine.descr = orderLine.descr

    var orderLineOptions = orderLine.options  // optionsWithNonDefaultValues()

    if (ArrayHelper.NotEmpty(orderLineOptions)) {

      for (let olOption of orderLineOptions) {
        let giftLineOption = GiftLineOption.fromOrderLineOption(olOption)
        giftLine.opts.push(giftLineOption)
      }
    }

    return giftLine
  }

  getOption(optionId: string): GiftLineOption {

    if (ArrayHelper.IsEmpty(this.opts))
      return undefined

    return this.opts.find(option => option.id == optionId)

  }

  sync(orderLine: OrderLine) {

    if (this.id != orderLine.id)
      throw new Error(`Can't sync orderLine with giftLine: id's different`)

    this.qty = orderLine.qty
    this.prc = orderLine.incl
    this.pId = orderLine.productId
    this.descr = orderLine.descr

    var orderLineOptions = orderLine.options  //optionsWithNonDefaultValues()

    if (ArrayHelper.NotEmpty(orderLineOptions)) {

      for (let olOption of orderLineOptions) {

        var giftLineOption = this.getOption(olOption.id)

        if (!giftLineOption) {
          let giftLineOption = GiftLineOption.fromOrderLineOption(olOption)
          this.opts.push(giftLineOption)
        } else {
          giftLineOption.sync(olOption)
        }



      }


    }


  }


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

export class Gift extends ObjectWithIdPlus {
  orgId?: string;
  branchId?: string;

  /*
  fromId String? @db.Uuid
  from   Contact? @relation(name: "giftsGiven", fields: [fromId], references: [id])
 
  toId String? @db.Uuid
  to   Contact? @relation(name: "giftsReceived", fields: [toId], references: [id])
*/

  fromId?: string;

  @Type(() => Contact)
  from?: Contact


  toId?: string;

  @Type(() => Contact)
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

  @Type(() => Date)
  expiresOn?: Date;

  /** the value of the gift in local currency */
  @Type(() => Number)
  value?: number

  /** the amount already used in local currency */
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


  /** created at */
  /*
  @Type(() => Date)
  crea = new Date()
*/

  //certificate: GiftCertificate = GiftCertificate.inStore


  constructor(createNewCode: boolean = false, markAsNew = false) {
    super()

    if (createNewCode)
      this.newCode()

    if (markAsNew)
      this.m.n = true
  }

  isAmount() {
    return this.type == GiftType.amount
  }

  getLine(lineId: string): GiftLine {

    if (!lineId || ArrayHelper.IsEmpty(this.lines))
      return undefined

    return this.lines.find(l => l.id == lineId)

  }

  newLine(orderLine: OrderLine): GiftLine {
    if (!orderLine)
      return null

    let giftLine = GiftLine.fromOrderLine(orderLine)

    if (!this.lines)
      this.lines = []

    this.lines.push(giftLine)

    return giftLine
  }

  /** check if given amount (or less) can be used */
  canUse(amount: number): CanUseGift {

    if (!amount || amount <= 0)
      return new CanUseGift(false, 0, CanUseGiftMsg.invalidAmount, `amount=${amount}`)

    if (!this.act)
      return new CanUseGift(false, 0, CanUseGiftMsg.notActive)

    /*     if (this.isConsumed)
          return new CanUseGift(false, 0, CanUseGiftMsg.alreadyConsumed, `isConsumed=true`) */

    let available = this.availableAmount()

    if (!available || available < 0)
      return new CanUseGift(false, 0, CanUseGiftMsg.alreadyConsumed, `available=${available}`)


    if (amount <= available)
      return new CanUseGift(true, amount)
    else {
      return new CanUseGift(true, available, CanUseGiftMsg.partialAmount)
    }

  }

  newCode() {
    this.code = ObjectHelper.createRandomString(6, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789")
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

    if (this.used >= this.value)
      this.isConsumed = true
    else
      this.isConsumed = false

  }


  isSpecific() {
    return this.type == GiftType.specific
  }

  availableAmount(maxAmount?: number) {

    if (this.used && this.used > 0)  // we had a bug that used was negative
      return this.value - this.used

    return maxAmount ? Math.min(maxAmount, this.value) : this.value

  }

  hasLines() {
    return Array.isArray(this.lines) && this.lines.length > 0
  }

  methodSelected() {
    const methods = this.methods
    return (methods.emailFrom || methods.emailTo || methods.pos || methods.postal)

  }


  /**
   * A gift is always created from an order, a gift needs to reflect what is ordered
   * 
   * @param order 
   * @param branch 
   */
  syncFromOrder(order: Order) {   // , branch?: Branch

    this.value = order.incl

    if (this.isSpecific()) {

      for (let orderLine of order.lines) {

        let giftLine = this.getLine(orderLine.id)

        if (!giftLine)
          giftLine = this.newLine(orderLine)
        else
          giftLine.sync(orderLine)



      }


    }




  }
}

