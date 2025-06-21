

import { Branch, DepositMode, Gender, Gift, IEmail, Invoice, LoyaltyCard, Message, MessageDirection, MsgType, Order, OrderLine, OrderType, Organisation, PlanningMode, Product, ProductResource, ProductType, Resource, ResourcePlanning, Schedule, Subscription, User, UserBase } from "ts-altea-model";
import { Exclude, Type, Transform } from "class-transformer";
import 'reflect-metadata';
import { ArrayHelper, ConnectTo, DateHelper, DbObjectCreate, IAsDbObject, ManagedObject, ObjectHelper, ObjectMgmt, ObjectReference, ObjectWithId, ObjectWithIdPlus, QueryOperator, TimeHelper } from 'ts-common'
import * as _ from "lodash";
import { PersonLine } from "../person-line";
import { DateRange, DateRangeSet, TimeBlock, TimeBlockSet, TimeOfDay, TimeSpan } from "../logic";
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

  /** certain tasks are related to a product (make a dish, clean-up) */
  productId?: string
  product?: Product

  status = TaskStatus.todo

  imp?: string  // important
  cmt?: string  // comment

  /** duration in minutes */
  dur: number = 0

  /** if true, then this task is planned (resourcePlanning record created, but can still be overruled by other plannings (ex. new customer request)) */
  plan: boolean = false

  planning: ResourcePlanning[]

  /** if true, then this task blocks the resource (task is planned & time is blocked in calendar) */
  block: boolean = false

  active = true

  createdAt = new Date()
  startedAt?: Date
  finishedAt?: Date
  updatedAt?: Date
  deletedAt?: Date


  @Exclude()
  _typedDate?: Date

  @Exclude()
  /** last date used to check if we need to parse the date again */
  _lastDate?: number

  @Exclude()
  get typedDate(): Date | undefined {
    if (!this.date)
      return undefined

    if (this._typedDate && this._lastDate === this.date)
      return this._typedDate

    this._typedDate = DateHelper.parse(this.date)
    this._lastDate = this.date
    return this._typedDate
  }


  set typedDate(value: Date) {
    this._typedDate = value
    this.date = DateHelper.yyyyMMdd(value)
  }

  startDate(): Date | undefined {
    let date = this.typedDate

    if (!date)
      return undefined

    let time = TimeOfDay.parse(this.time)

    return dateFns.set(date, { hours: time.hours, minutes: time.minutes })
  }

  endDate(): Date | undefined {
    let date = this.startDate()

    if (!date)
      return undefined

    return dateFns.addMinutes(date, this.dur)
  }


  /** Convert a recurring task (schedule<>'once') into a concrete task (schedule='once') */
  toInstance(): Task {

    let clone: Task = ObjectHelper.clone(this, Task)

    clone.id = ObjectHelper.newGuid()
    clone.createdAt = new Date()
    clone.origSched = this.schedule
    clone.schedule = TaskSchedule.once
    clone.rTaskId = this.id


    /*
    clone.hrIds = ['e738d496-a66d-414e-a098-d5ca84403e9d']
    clone.date = DateHelper.yyyyMMdd()
    clone.time = '09:00'
    */

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
