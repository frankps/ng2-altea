

import { Branch,  DepositMode, Gender, Gift, IEmail, Invoice, LoyaltyCard, Message, MessageDirection, MsgType, Order, OrderLine, OrderType, Organisation, PlanningMode, Product, ProductResource, ProductType, Resource, ResourcePlanning, Schedule, Subscription, User, UserBase } from "ts-altea-model";
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



export enum TaskSchedule {
    once = 'once',
    daily = 'daily',
    twiceAWeek = 'twiceAWeek',
    weekly = 'weekly',
    twiceAMonth = 'twiceAMonth',
    monthly = 'monthly',
    quarterly = 'quarterly',
    yearly = 'yearly',
    manual = 'manual'
  }
  
  export enum TaskStatus {
    todo = 'todo',
    progress = 'progress',
    done = 'done',
    skip = 'skip'
  }
  
  export enum TaskPriority {
    notUrgent = 0,
    normal = 10,
    asap = 20,
    urgent = 30
  }
  
  export class Task extends ObjectWithIdPlus {
    branchId?: string
  
    name: string
    loc?: string
    info?: string
  
    prio = TaskPriority.normal
  
    date?: number // format: yyyymmdd
    time: string // format: hh:mm
  
    // the parent recurring task
    rTaskId?: string
  
    schedule = TaskSchedule.once
  
    /** if coming from recurring task: schedule of recurring task */
    origSched?: TaskSchedule
  
    /** human resources = staff, links to a resource or resource group */
    hrIds?: string[] = []
  
    /* the staff member that executes/executed the task (never a resource group) */
    hrExecId?: string
  
    hrExec?: Resource
  
    /* the user */
    userId?: string
  
    /* name of user executing/executed task */
    by?: string
  
    status = TaskStatus.todo
  
    imp?: string  // important
    cmt?: string  // comment
  
    active = true
  
    createdAt = new Date()
    startedAt?: Date
    finishedAt?: Date
    updatedAt?: Date
    deletedAt?: Date
  
  
    /** Convert a recurring task (schedule<>'once') into a concrete task (schedule='once') */
    toInstance(): Task {
  
      let clone: Task = ObjectHelper.clone(this, Task)
  
      clone.id = ObjectHelper.newGuid()
      clone.createdAt = new Date()
      clone.origSched = this.schedule
      clone.schedule = TaskSchedule.once
      clone.rTaskId = this.id
  
      // clone.id = null  // because it is a new task
  
      return clone
    }
  
    isRecurrent(): boolean {
      return this.schedule != TaskSchedule.once
    }
  
    htmlStyle(): string {
      return `color: ${this.color()}`
    }
  
    get template(): boolean {
      return this.schedule == TaskSchedule.manual
    }
  
    set template(value: boolean) {
  
      if (value)
        this.schedule = TaskSchedule.manual
      else
        this.schedule = TaskSchedule.once
  
      //return this.schedule == TaskSchedule.manual
    }
  
    private backColorForSchedule(schedule: TaskSchedule): string {
  
      switch (schedule) {
  
        case TaskSchedule.daily:
          return '#FFF0F0'
  
        case TaskSchedule.twiceAWeek:
          return '#F2FAFF'
  
        case TaskSchedule.weekly:
          return '#E5F5FF'
  
      }
  
      return "white"
    }
  
  
    backColor() {
  
      if (this.origSched)
        return this.backColorForSchedule(this.origSched)
      else return this.backColorForSchedule(this.schedule)
  
    }
  
    color(): string {
      switch (this.prio) {
        case TaskPriority.urgent:
          return 'red'
        case TaskPriority.asap:
          return 'orange'
        default:
          return 'green'
      }
    }
  }
  