import { Branch,  Contact,  DepositMode, Gender, Gift, Invoice, LoyaltyCard, Order, OrderLine, OrderType, Organisation, PlanningMode, Product, ProductResource, ProductType, ProviderInfo, Resource, ResourcePlanning, Schedule, Subscription } from "ts-altea-model";
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



/**
 * implements shared logic for Contact & User
 */
export class UserBase extends ObjectWithIdPlus {

    /** Allowed messaging for communication (valid strings: see enum MsgTyp) */
    msg: string[] = ['email', 'wa', 'sms']
  
    /** Is the given message type selected? */
    msgTypeSelected(type: any): boolean {
      if (!type || ArrayHelper.IsEmpty(this.msg))
        return false
  
      return this.msg.indexOf(type) >= 0
    }
  
    selectMsgType(msgType: any, selected: boolean) {
  
      console.log(msgType, selected)
  
      if (!this.msg)
        this.msg = []
  
      if (selected) {
  
        if (!this.msgTypeSelected(msgType))
          this.msg.push(msgType)
  
      } else {
  
        const idx = this.msg.indexOf(msgType)
  
        if (idx >= 0)
          this.msg.splice(idx, 1)
  
      }
  
  
    }
  
  
  }
  
  export class User extends UserBase {
  
    uid?: string
  
    prov?: string
    provId?: string
    provEmail?: string
  
    @Type(() => ProviderInfo)
    prv?: ProviderInfo = new ProviderInfo()
  
    /** initial data received from provider (facebook, google) via Firebase */
    prvOrig?: any
  
    first?: string
    last?: string
  
    email?: string
    mobile?: string
  
    @Type(() => Contact)
    contacts: Contact[]
  
    @Type(() => Resource)
    resources: Resource[]
  
    mobileValid(): boolean {
      console.log(this.mobile)
      const valid = (this.mobile != null && this.mobile != undefined && this.mobile.length > 5)
      console.log(valid)
      return valid
    }
  
    /** last login date */
    @Type(() => Date)
    public login: Date = new Date()
  
  }
  