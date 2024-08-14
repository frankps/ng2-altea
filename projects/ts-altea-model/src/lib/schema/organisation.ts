
import { Branch, Contact, DepositMode, Gender, Gift, GiftConfig, Invoice, LoyaltyCard, MsgInfo, MsgType, Order, OrderLine, OrderType, PlanningMode, Product, ProductResource, ProductType, Resource, ResourcePlanning, Schedule, Subscription, TimeUnit, TimeUnitHelper, User, UserBase } from "ts-altea-model";
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


export class Organisation extends ObjectWithIdPlus {

    idx = 0
    name?: string;
    short?: string;
    unique?: string;
    email?: string;
    url?: string;
    mobile?: string;
    phone?: string;
    category?: string;
    descr?: string;
    multiBranch = false
    agreeTerms = false
    optInNews = false
  
    //@Type(() => Branch)
    branches?: Branch[];
  
    //@Type(() => Resource)
    resources?: Resource[];
  
    // @Type(() => ProductCategory)
    // categories?: ProductCategory[];
  
    //@Type(() => Product)
    products?: Product[];
  
    //@Type(() => Contact)
    contacts?: Contact[];
  
    //@Type(() => Order)
    orders?: Order[];
  
    asDbObject(): DbObjectCreate<Organisation> {
      return new DbObjectCreate<Organisation>('organisation', Organisation, this)
    }
  }
  
  