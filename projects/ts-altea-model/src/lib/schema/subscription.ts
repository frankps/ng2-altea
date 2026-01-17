
import { Branch, Contact, DepositMode, Gift, Invoice, Order, OrderLine, OrderLineOption, OrderType, Organisation, Payment, PlanningMode, Product, ProductResource, ProductType, ResourcePlanning, Schedule, User } from "ts-altea-model";
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

export class CanUseSubscription {

  qty: number

  info: string
}

export class Subscription extends ObjectWithIdPlus {

  static jsonProps = ['options']

  orgId?: string;
  branchId?: string;

  @Type(() => Contact)
  contact?: Contact;
  contactId?: string;

  // @Type(() => Order)
  order?: Order;

  /** the purchase order id */
  orderId?: string;
  name?: string;

  @Type(() => Payment)
  payments: Payment[]

  remark?: string;

  @Type(() => Product)
  subscriptionProduct?: Product;

  subscriptionProductId?: string;

  @Type(() => Product)
  unitProduct?: Product;

  unitProductId?: string;

  /** Customer can purchase a subscription for hair removal of specific zones (zones are selected as orderline options: example arms & legs)
   * These zones are copied over to the subscription (so that it can only be used for arms & legs)
   */
  @Type(() => OrderLineOption)
  options: OrderLineOption[] = []

  firstUsedOn?: Date;
  expiresOn?: Date;
  totalQty = 0;
  usedQty = 0;


  /**
   * The available quantity
   * @returns 
   */
  openQty(): number {
    return this.totalQty - this.usedQty
  }

  hasOptions(): boolean {

    return ArrayHelper.NotEmpty(this.options)

  }

  hasPayments(): boolean {

    return ArrayHelper.NotEmpty(this.payments)
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

  /** In case of a product bundle, return the product ids of the items, otherwise just the unit product id */
  getUnitProductIds(): string[] {
  

    if (this.unitProduct?.hasItems())
      return this.unitProduct.items.flatMap(item => item.productId)

    return [this.unitProductId]
  }

  /** created at */
  /*
  @Type(() => Date)
  crea = new Date();
  */
}