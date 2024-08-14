
import { Branch, Contact, DepositMode, Gift, Invoice, Order, OrderLine, OrderType, Organisation, PlanningMode, Product, ProductResource, ProductType, ResourcePlanning, Schedule, User } from "ts-altea-model";
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


export class Subscription extends ObjectWithIdPlus {

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
    unitProductId?: string;
    firstUsedOn?: Date;
    expiresOn?: Date;
    totalQty = 0;
    usedQty = 0;
  
    /** created at */
    /*
    @Type(() => Date)
    crea = new Date();
    */
  }