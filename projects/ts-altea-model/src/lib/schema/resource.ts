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



export enum ResourceType {
    human = 'human',
  
    // do NOT use anymore, use location instead!
    //room = 'room',
    location = 'location',
    device = 'device',
    //  group = 'group',
  }
  
  export enum ResourceTypeIcons {
    human = 'fa-duotone fa-person-dress',
    room = 'fa-duotone fa-house',
    device = 'fa-duotone fa-computer-classic',  // fa-tablet-rugged
    group = 'fa-duotone fa-user-group',
  }
  
  export enum ResourceTypeCircleIcons {
    human = 'fa-solid fa-circle-user',
    room = 'fa-duotone fa-house',
    device = 'fa-duotone fa-tablet-rugged',
    group = 'fa-duotone fa-user-group',
  }
  
  export class Resource extends ObjectWithIdPlus {
  
    @Type(() => ResourceLink)
    groups?: ResourceLink[];
  
    @Type(() => ResourceLink)
    children?: ResourceLink[];
  
    @Type(() => ProductResource)
    products?: ProductResource[];
  
    /*   @Type(() => Scheduling)
      scheduling?: Scheduling[]; */
  
    @Type(() => Schedule)
    schedules?: Schedule[];
  
    organisation?: Organisation | ConnectTo;
    orgId?: string;
  
    branch?: Branch | ConnectTo;
    branchId?: string;
  
    name?: string;
    type?: ResourceType;
  
    short?: string;
    descr?: string;
    color?: string;
    qty = 1
  
  
    start?: number | null;
  
  
    end?: number | null;
  
    label?: string;
    prio?: number;
    isGroup = false
    //isRole?: boolean;
    tel?: string;
    email?: string;
  
    /** human resources only: staff member can be selected online by customers as prefered */
    online?: boolean;
  
    /** human resources only: can be linked to an actual user (that can log-in) */
    userId?: string
    user?: User
  
    branches?: string[];
    /*   active?: boolean;
      deleted?: boolean;
      deletedAt?: Date; */
  
    /** Most resources use the schedule (opening hours) of the branch, but a custom schedule can be specified per resource  */
    customSchedule = false
  
    @Exclude()
    _startDate: Date | null = null
  
    @Exclude()
    _endDate: Date | null = null
  
    /** get this.branch as Branch (and not ConnectTo) */
    branchType(): Branch {
      return this.branch as Branch
    }
  
    shortOrName(): string {
      return (this.short) ? this.short : this.name!
    }
  
    canChangeQty(): boolean {
      return (this.type == ResourceType.device || this.type == ResourceType.location)
    }
  
  
    getChildResources(): Resource[] {
  
      if (!Array.isArray(this.children))
        return []
  
      let resourceLinks = this.children.filter(resourceLink => resourceLink?.child)
  
      resourceLinks = _.orderBy(resourceLinks, ['pref'], ['desc'])
  
      const childResources = resourceLinks.map(resourceLink => resourceLink.child!)
  
      return childResources
      /*
      const childResources: Resource[] = []
  
      if (!Array.isArray(this.children))
        return childResources
  
      for (const resourceLink of this.children!) {
  
        if (resourceLink.child)
          childResources.push(resourceLink.child)
      }
  
      return childResources
      */
    }
  
    get startDate(): Date | null {
  
      if (!this.start)
        return null
  
      if (this._startDate && DateHelper.yyyyMMddhhmmss(this._startDate) === this.start)
        return this._startDate
  
      this._startDate = DateHelper.parse(this.start)
      return this._startDate
  
  
    }
  
  
    set startDate(value: Date | null) {
  
      if (value) {
        this.start = DateHelper.yyyyMMdd(value) * 1000000  // * 1000000 because we don't care about hhmmss
        this._startDate = null
      }
      else
        this.start = null
  
    }
  
  
  
    get endDate(): Date | null {
  
      if (!this.end)
        return null
  
      if (this._endDate && DateHelper.yyyyMMddhhmmss(this._endDate) === this.end)
        return this._endDate
  
      this._endDate = DateHelper.parse(this.end)
      return this._endDate
  
    }
  
  
    set endDate(value: Date | null) {
  
      if (value) {
        this.end = DateHelper.yyyyMMdd(value) * 1000000
        this._endDate = null
      }
      else
        this.end = null
  
    }
  
  
    get hasStart(): boolean {
      return (this.start !== undefined && this.start !== null)
    }
  
    set hasStart(value: boolean) {
  
      if (value) {
        const now = new Date()
        this.start = DateHelper.yyyyMMddhhmmss(now)
        //  this.start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(),6))
      }
      else
        this.start = null
  
    }
  
  
    get hasEnd(): boolean {
      return (this.end !== undefined && this.end !== null)
    }
  
    set hasEnd(value: boolean) {
  
      if (value) {
        const now = new Date()
        this.end = DateHelper.yyyyMMddhhmmss(now)
        // this.end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(),21))
      }
      else
        this.end = null
  
    }
  
  }
  
  export class ResourceLink extends ManagedObject {
  
    @Exclude()
    get id(): string {
      return `${this.groupId}_${this.childId}`
    }
  
    // was needed, otherwise compiler error
    newId() {
     // this.id = ObjectHelper.newGuid()
    }

    groupId?: string;
    childId?: string;
  
    @Type(() => Resource)
    group?: Resource;
  
    @Type(() => Resource)
    child?: Resource;
  
    /** preference */
    pref = 0
  
  
    /** object is active */
    public act: boolean = true
  
    /** object is deleted */
    public del: boolean = true
  
    /** last update performed on object (starting with creation and ending with soft delete => del=true) */
    @Type(() => Date)
    public upd: Date = new Date()
  
  
  }
  
  