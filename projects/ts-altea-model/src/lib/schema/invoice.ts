

import { Branch,  Contact,  DepositMode, Gender, Gift, LoyaltyCard, Order, OrderLine, OrderType, Organisation, PlanningMode, Product, ProductResource, ProductType, ResourcePlanning, Schedule, Subscription, User, UserBase } from "ts-altea-model";
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
  
  export class Invoice extends ObjectWithIdPlus {
  
    orders?: Order[];
  
    state: InvoiceState = InvoiceState.toInvoice
  
    @Type(() => Contact)
    to?: Contact;
    toId?: string;
  
    num?: string;
  
    company?: string
    vat?: string
    country?: string = 'BEL'
    address?: string
  
    email?: string
  
    date?: Date
  
    /** alternative message for on invoice */
    alter?: string
  
  
  }
  