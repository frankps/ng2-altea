
import { Branch,  DepositMode, Gender, Gift, Invoice, LoyaltyCard, Order, OrderLine, OrderType, Organisation, PlanningMode, Product, ProductResource, ProductType, ResourcePlanning, Schedule, Subscription, User, UserBase } from "ts-altea-model";
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



export class Contact extends UserBase {

    //@Type(() => Organisation)
    organisation?: Organisation;
  
    branch?: Branch;
  
    orgId?: string
    branchId?: string
  
    @Type(() => Order)
    orders?: Order[];
    name?: string;
    first?: string;
    last?: string
  
    alert?: string
    remark?: string
    color?: string
  
    /** a unique code to automatically enter the shop/business (code panel/QR) */
    entry?: string
  
    gender: Gender = Gender.unknown
    birth?: number;  // format: yyyyMMdd
    email?: string;
    /** Email address confirmed */
    emailConf = false
  
    mobile?: string;
    /** Mobile number confirmed */
    mobileConf = false
  
  
    /** Allowed messaging for communication (valid strings: see enum MsgTyp) */
    //msg: string[] = ['email', 'wa']
  
    phone?: string;
  
    /** language: iso2, lower case */
    lang?: string;
  
    str?: string;
    strNr?: string;
    postal?: string;
    city?: string;
    country?: string;
  
    company?: string;
    vatNum?: string;
    branches?: string[];
  
    deposit: DepositMode = DepositMode.default
    depositPct?: number
  
    news: boolean = false
    rules: boolean = false
  
    /*   active = true
      deleted = false
      deletedAt?: Date; */
  
    @Type(() => User)
    user?: User
    userId?: string
  
    @Type(() => Subscription)
    subscriptions?: Subscription[]
  
    /** gifts given by this contact to others */
    @Type(() => Gift)
    giftsOut?: Gift[]
  
    /** received gifts (can also be gifts created by system for cancellations) */
    @Type(() => Gift)
    giftsIn?: Gift[]
  
    @Type(() => LoyaltyCard)
    cards?: LoyaltyCard[]
  
  
  
    setName() {
  
      let components = []
  
      if (this.first) {
        this.first = sc.capitalcase(this.first)
        components.push(this.first)
      }
  
      if (this.last) {
        this.last = sc.capitalcase(this.last)
        components.push(this.last)
      }
  
      if (components.length == 0 && this.company)
        components.push(this.company)
  
      this.name = components.join(' ')
    }
  
    getName(): string {
      let components = []
  
      if (this.first) {
        this.first = sc.capitalcase(this.first)
        components.push(this.first)
      }
  
      if (this.last) {
        this.last = sc.capitalcase(this.last)
        components.push(this.last)
      }
  
      const name = components.join(' ')
  
      return name
  
    }
  
  
  }
  