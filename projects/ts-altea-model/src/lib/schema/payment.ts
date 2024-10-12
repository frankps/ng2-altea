import { Branch, Contact, DepositMode, Gift, Invoice, Order, OrderLine, OrderType, Organisation, PlanningMode, Product, ProductType, Resource, ResourcePlanning, Subscription } from "ts-altea-model";
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


export enum PaymentType {
    cash = 'cash',
    transfer = 'transfer',
    credit = 'credit',
    debit = 'debit',
    gift = 'gift',
    stripe = 'stripe',
    /** subscription */
    subs = 'subs',
  }
  
  export class Payment extends ObjectWithIdPlus {
  
    idx = 0
  
    @Type(() => Order)
    order?: Order;
    orderId?: string;
  
    @Type(() => Number)
    amount = 0
  
    type: PaymentType

    loc: string
  
  
    @Type(() => Gift)
    gift?: Gift
    giftId?: string
  
    @Type(() => Subscription)
    subs?: Subscription
    subsId?: string
  
    bankTxId?: string
    bankTxNum?: string
  
    //date?: Date = new Date()
  
    @Type(() => Number)
    date?: number; // format: yyyyMMddHHmmss
  
    info?: string
  
    /** amount is declared */
    decl: boolean = false
  
    /** provider id, if payment executed by external provider (example: Stripe payment intent id) */
    provId: string

    constructor() {
      super()
  
      this.date = DateHelper.yyyyMMddhhmmss()
  
    }
  
  }