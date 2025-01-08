
import { Branch, Contact, DepositMode, Gift, Invoice, Order, OrderLine, OrderLineOption, OrderType, Organisation, PlanningMode, Product, ProductResource, ProductType, ResourcePlanning, Schedule, User } from "ts-altea-model";
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
  remark?: string;

  @Type(() => Product)
  subscriptionProduct?: Product;

  subscriptionProductId?: string;

  @Type(() => Product)
  unitProduct?: Product;

  /** Customer can purchase a subscription for hair removal of specific zones (zones are selected as orderline options: example arms & legs)
   * These zones are copied over to the subscription (so that it can only be used for arms & legs)
   */
  @Type(() => OrderLineOption)
  options: OrderLineOption[] = []

  unitProductId?: string;
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

  /** created at */
  /*
  @Type(() => Date)
  crea = new Date();
  */
}