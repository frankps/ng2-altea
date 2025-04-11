

import { Branch, Contact, DepositMode, Invoice, Order, OrderLine, OrderType, Organisation, PlanningMode, Product, ProductResource, ProductSubType, ProductType, Resource, ResourcePlanning, Schedule, User } from "ts-altea-model";
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



/** Products can be included/excluded to a program based on id or on a search string (to be applied to product name) */
export enum LoyaltyProductMode {
  id = 'id',
  search = 'search'
}

/** Loyalty programs are configured for certain products/services. These can be included or excluded from the program (program.incl or program.excl)
 * using the LoyaltyProduct class
 */
export class LoyaltyProduct {
  // id: string
  // name: string
  // mode: LoyaltyProductMode.id

  constructor(public mode = LoyaltyProductMode.id, public name?: string, public id?: string) {

  }

  static fromProduct(product: Product) {

    return new LoyaltyProduct(LoyaltyProductMode.id, product.name, product.id)

  }
}

export enum LoyaltyRewardType {
  /** general discount, can be applied to any order */
  discount = 'discount',
  /** discount for certain products only */
  productDiscount = 'productDiscount',

  freeProduct = 'freeProduct',
}

/** introduced for use case: 3rd hour of wellness free
 *  Since duration is a product option, we need to express that this option should be minimum 3
 */
export enum LoyaltyOptionCondition {
  /** equal */
  eql = 'eql',
  /** minimum, value should be >= */
  min = 'min'
}

export class LoyaltyRewardOptionValue {

  constructor(public id: string, public name: string, public idx: number) { }
}

export class LoyaltyRewardOption {
  id: string
  name: string
  idx: number

  @Type(() => LoyaltyRewardOptionValue)
  values: LoyaltyRewardOptionValue[] = []
  cond: LoyaltyOptionCondition

  valueNames(separator = ', '): string {

    if (!this.values)
      return ''

    return this.values.map(v => v.name).join(separator)
  }

}

export class LoyaltyRewardProduct {
  id: string
  name: string

  @Type(() => LoyaltyRewardOption)
  options: LoyaltyRewardOption[]
}
export class LoyaltyReward {

  id: string

  name: string = ''

  type: LoyaltyRewardType = LoyaltyRewardType.discount

  /** min amount on card to receive this reward */
  amount: number = 0


  /** value received if amount  */
  discount: number = 0

  @Type(() => LoyaltyRewardProduct)
  product: LoyaltyRewardProduct

  constructor() {
    this.id = ObjectHelper.newGuid()
  }

  label(): string {

    if (this.name)
      return this.name
    else if (this.product?.name)
      return this.product?.name

    return ''
  }

  hasDiscount() {

    return (this.type == LoyaltyRewardType.discount || this.type == LoyaltyRewardType.productDiscount) && this.discount
  }

  hasProductOptions() {

    return (ArrayHelper.AtLeastOneItem(this.product?.options))
  }

}



export enum LoyaltyUnit {
  priceIncl = 'priceIncl',
  qty = 'qty'
}

export class LoyaltyProgram extends ObjectWithIdPlus {

  orgId?: string
  branchId?: string

  @Type(() => LoyaltyCard)
  cards?: LoyaltyCard[]

  name?: string
  descr?: string
  maxValue: number = -1
  maxDaysValid: number = -1

  track: LoyaltyUnit = LoyaltyUnit.qty

  /** products included?  */
  prod = true

  /** basic services included?  */
  svc_basic = true

  /** bundled services included?  */
  svc_bundle = true

  /** subscription services included? */
  svc_subs = true

  /** promotions included in program? */
  promo = false


  @Type(() => LoyaltyProduct)
  incl: LoyaltyProduct[] = []

  @Type(() => LoyaltyProduct)
  excl: LoyaltyProduct[] = []

  @Type(() => LoyaltyReward)
  rewards: LoyaltyReward[] = []

  idx = 0

  getRewardById(id: string): LoyaltyReward {

    if (ArrayHelper.IsEmpty(this.rewards))
      return null

    let reward = this.rewards.find(reward => reward.id == id)

    return reward
  }


  hasIncludedCategories(): boolean {
    return (this.prod || this.svc_basic || this.svc_bundle || this.svc_subs || this.promo)
  }

  includedCategories(): string[] {

    const cats = []
    if (this.prod) cats.push('prod')
    if (this.svc_basic) cats.push('svc_basic')
    if (this.svc_bundle) cats.push('svc_bundle')
    if (this.svc_subs) cats.push('svc_subs')
    if (this.promo) cats.push('promo')

    return cats
  }

  hasExcludedCategories(): boolean {
    return (!this.prod || !this.svc_basic || !this.svc_bundle || !this.svc_subs || !this.promo)
  }

  excludedCategories(): string[] {

    const cats = []
    if (!this.prod) cats.push('prod')
    if (!this.svc_basic) cats.push('svc_basic')
    if (!this.svc_bundle) cats.push('svc_bundle')
    if (!this.svc_subs) cats.push('svc_subs')
    if (!this.promo) cats.push('promo')

    return cats
  }

  hasIncl(): boolean {
    return ArrayHelper.AtLeastOneItem(this.incl)
  }

  includesProduct(product: Product): boolean {

    let productId = product.id

    if (!this.hasIncl())
      return false

    let idx = this.incl.findIndex(p => p.id == productId)

    if (idx >= 0)
      return true

    // also check folders (we only check products in category, not inside sub-categories)

    let categoryId = product.catId

    if (!categoryId)
      return false

    idx = this.incl.findIndex(p => p.id == categoryId)

    return (idx >= 0)
  }

  hasExcl(): boolean {
    return ArrayHelper.AtLeastOneItem(this.excl)
  }

  excludesProduct(productId: string) {

    if (!this.hasExcl())
      return false

    const idx = this.excl.findIndex(p => p.id == productId)

    return (idx >= 0)
  }

  hasRewards(): boolean {
    return ArrayHelper.AtLeastOneItem(this.rewards)
  }


  hasProduct(product: Product): boolean {
    let inProgram = false

    if (!product)
      return false

    if (this.prod && product.type == ProductType.prod) // if loyalty program is enabled for products
      inProgram = true
    else if (product.type == ProductType.svc) {  // in case of a service product

      if (this.svc_basic && product.sub == ProductSubType.basic) // if loyalty program is enabled for basic services
        inProgram = true
      else if (this.svc_bundle && product.sub == ProductSubType.bundle) // if loyalty program is enabled for bundled services 
        inProgram = true
      else if (this.svc_subs && product.sub == ProductSubType.subs) // if loyalty program is enabled for subscription services 
        inProgram = true
    }

    if (!inProgram && this.includesProduct(product)) {
      inProgram = true
    }

    if (inProgram && this.excludesProduct(product.id)) {
      inProgram = false
    }

    return inProgram

  }
}


export class RegisterLoyalty {

  /*
  orderId: string
  contactId: string
*/
  lines: LoyaltyLine[] = []

  constructor(public order: Order) {

  }


  getLinesForPrograms(programIds: string[]) {

    const lines = this.lines.filter(line => programIds.indexOf(line.programId) >= 0)

    return lines
  }

  getLinesForOtherPrograms(programIds: string[]) {

    const lines = this.lines.filter(line => programIds.indexOf(line.programId) == -1)

    return lines
  }
}

export class LoyaltyLine {

  constructor(public programId: string, public name: string, public extra: number) { }
}


export class LoyaltyCardChange extends ObjectWithId {
  // public id?: string;

  public static newValue(orderId: string, cardId: string, value: number, info?: string) {
    const change = new LoyaltyCardChange()
    change.orderId = orderId
    change.cardId = cardId
    change.value = value
    change.info = info

    return change
  }

  public static newReward(orderId: string, cardId: string, rewardId: string, value: number) {
    const change = new LoyaltyCardChange()

    change.orderId = orderId
    change.cardId = cardId
    change.rewardId = rewardId
    change.value = -value

    return change
  }

  card?: LoyaltyCard
  cardId?: string

  value: number = 0

  total: number = 0

  isReward: boolean = false
  reward: any

  orderId?: string

  @Type(() => Order)
  order?: Order

  rewardId?: string

  info?: string

  @Type(() => Date)
  public date: Date = new Date()
}

export class LoyaltyCard extends ObjectWithIdPlus {


  public static new(contactId?: string, programId?: string, name?: string, value: number = 0): LoyaltyCard {

    const card = new LoyaltyCard()
    card.contactId = contactId
    card.programId = programId
    card.name = name
    card.value = value

    return card

  }


  contact?: Contact
  contactId?: string

  program?: LoyaltyProgram
  programId?: string

  changes?: LoyaltyCardChange[]

  name?: string
  value: number = 0

  hasChanges() {
    return ArrayHelper.NotEmpty(this.changes)
  }

  getChangesByInfo(info: string) : LoyaltyCardChange[] {

    if (!this.hasChanges())
      return null

    let changes = this.changes.filter(c => c.info?.indexOf(info) >= 0)

    return changes
  }

}
