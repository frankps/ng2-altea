import { Branch, Contact, DepositMode, Gift, Invoice, Order, OrderLine, OrderType, Organisation, PlanningMode, Product, ProductResource, ProductType, Resource, ResourceType, Schedule, User } from "ts-altea-model";
import { Exclude, Type, Transform } from "class-transformer";
import 'reflect-metadata';
import { ArrayHelper, ConnectTo, DateHelper, DbObjectCreate, IAsDbObject, ManagedObject, ObjectHelper, ObjectMgmt, ObjectReference, ObjectWithId, ObjectWithIdPlus, QueryOperator, StringHelper, TimeHelper } from 'ts-common'
import * as _ from "lodash";
import { PersonLine } from "../person-line";
import { DateRange, DateRangeSet, TimeBlock, TimeBlockSet, TimeSpan } from "../logic";
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as sc from 'stringcase'
import { OrderPersonMgr } from "../order-person-mgr";
import { CancelOrderMessage } from "ts-altea-logic";

export enum PlanningType {
  /** occupied */
  occ = 'occ',   // occupied, typically used for order planning
  hol = 'hol',   // holidays 
  bnk = 'bnk',   // bank holiday
  ill = 'ill',
  abs = 'abs',   // absence, not paid by employer
  edu = 'edu',
  avl = 'avl',    // available
  sch = 'sch',    // planning schedule
  brk = 'brk'     // break (such as lunch break): at work, but not working
}


/** Manage multiple ResourcePlanning's  */
export class ResourcePlannings {

  constructor(public plannings: ResourcePlanning[] = []) {

  }


  add(extraPlannings: ResourcePlannings) {


    if (!extraPlannings || extraPlannings.isEmpty())
      return

    this.plannings.push(...extraPlannings.plannings)

  }

  minTime(): TimeSpan {

    if (ArrayHelper.IsEmpty(this.plannings))
      return TimeSpan.zero

    let durSeconds: number[] = this.plannings.map(plan => {

      if (!plan.start || !plan.end)
        return null

      let durationSeconds = dateFns.differenceInSeconds(plan.endDate, plan.startDate)

      return durationSeconds
    }).filter(dur => dur && dur > 0)


    let minSeconds = _.min(durSeconds)

    return TimeSpan.seconds(minSeconds)


  }

  isEmpty(): boolean {
    return ArrayHelper.IsEmpty(this.plannings)
  }

  notEmpty(): boolean {
    return ArrayHelper.NotEmpty(this.plannings)
  }

  filterByType(...types: PlanningType[]): ResourcePlannings {
    const plannings = this.plannings.filter(rp => types.indexOf(rp.type) >= 0)

    if (!Array.isArray(plannings))
      return new ResourcePlannings()

    return new ResourcePlannings(plannings)
  }



  filterByResource(resourceId: string): ResourcePlannings {
    const planningsForResource = this.plannings.filter(rp => rp.resourceId == resourceId && !rp.scheduleId)

    if (!Array.isArray(planningsForResource))
      return new ResourcePlannings()

    return new ResourcePlannings(planningsForResource)
  }


  groupByOrderId(plannings: ResourcePlanning[]): Map<string, ResourcePlanning[]> {

    let map = new Map<string, ResourcePlanning[]>()

    if (ArrayHelper.IsEmpty(plannings))
      return map

    for (let planning of plannings) {
      let orderId = planning.orderId

      if (!orderId)
        orderId = ""

      if (map.has(orderId))
        map.get(orderId).push(planning)
      else
        map.set(orderId, [planning])
    }

    return map
  }

  merge(plannings1: ResourcePlannings, plannings2: ResourcePlannings): ResourcePlannings {

    if (plannings1.isEmpty()) return plannings2
    if (plannings2.isEmpty()) return plannings1

    let ranges1 = plannings1.toDateRangeSet()
    let ranges2 = plannings2.toDateRangeSet()
    let plannings2Array: ResourcePlanning[] = [...plannings2.plannings]

    let result: ResourcePlanning[] = []

    for (let idx = 0; idx < ranges1.count; idx++) {
      let range1: DateRange = ranges1.ranges[idx]
      let planning1: ResourcePlanning = plannings1.plannings[idx]

      let range2Idx = ranges2.indexOfRangeBiggestOverlap(range1)

      if (range2Idx == -1)
        result.push(planning1)

      let range2: DateRange = ranges2.ranges[range2Idx]
      let union: DateRange = range1.unionOfOverlapping(range2)
      let newPlanning = planning1.clone()
      newPlanning.setDates(union)

      result.push(newPlanning)

      // ranges2 & plannings2Array should be in sync
      ranges2.ranges.splice(range2Idx, 1)
      plannings2Array.splice(range2Idx, 1)
    }

    if (ArrayHelper.NotEmpty(plannings2Array)) {
      result.push(...plannings2Array)
    }

    return new ResourcePlannings(result)
  }
  
  /**
   * If we have 2 group resource plannings with same times & overlap allowed and different order, then this can be grouped (=> can be executed by same person)
   * If they are from the same order, then it means that 2 seperated resources are needed (otherwise there should have been 1 resource planning)
   */
  groupByOverlapAllowed(): ResourcePlannings {

    // group per order
    let planningsByOrderId: Map<string, ResourcePlanning[]> = this.groupByOrderId(this.plannings)

    let orderIds = Array.from(planningsByOrderId.keys())

    const nrOfOrderIds = orderIds.length

    if (nrOfOrderIds <= 1)
      return this

    let orderId = orderIds[0]
    let newPlannings: ResourcePlannings = new ResourcePlannings(planningsByOrderId.get(orderId))

    for (let i = 1; i < nrOfOrderIds; i++) {
      let nextOrderId = orderIds[i]
      let nextPlannings = new ResourcePlannings(planningsByOrderId.get(nextOrderId))

      newPlannings = this.merge(newPlannings, nextPlannings)
    }

    return newPlannings
  }

  filterByResourceOverlapAllowed(resourceId: string, overlap: boolean = false): ResourcePlannings {

    // Debugging

    /*
    let debug = this.plannings.filter(rp => rp.resourceId == resourceId)

    debug = _.sortBy(debug, 'start')

    console.error(debug)
    */

    const planningsForResource = this.plannings.filter(rp => rp.resourceId == resourceId && rp.overlap == overlap && !rp.scheduleId)

    if (!Array.isArray(planningsForResource))
      return new ResourcePlannings()

    return new ResourcePlannings(planningsForResource)
  }

  filterByDateRangeResourceGroupsOnly(groupResourceIds: string[], from: Date | number, to: Date | number): ResourcePlannings {

    let fromNum = from instanceof Date ? DateHelper.yyyyMMddhhmmss(from) : from
    let toNum = to instanceof Date ? DateHelper.yyyyMMddhhmmss(to) : to

    const debug = this.plannings.filter(rp => rp.resourceGroupId && !rp.resourceId &&
      rp.end > fromNum && rp.start < toNum)

    console.error(debug)

    const planningsForResource = this.plannings.filter(rp => rp.resourceGroupId && !rp.resourceId &&
      groupResourceIds.indexOf(rp.resourceGroupId) >= 0 && rp.end > fromNum && rp.start < toNum)

    if (!Array.isArray(planningsForResource))
      return new ResourcePlannings()

    return new ResourcePlannings(planningsForResource)
  }


  filterByResourceDateRange(resourceId: string, from: Date | number, to: Date | number): ResourcePlannings {

    let fromNum = from instanceof Date ? DateHelper.yyyyMMddhhmmss(from) : from
    let toNum = to instanceof Date ? DateHelper.yyyyMMddhhmmss(to) : to

    const planningsForResource = this.plannings.filter(rp => rp.resourceId == resourceId && rp.end > fromNum && rp.start < toNum)

    if (!Array.isArray(planningsForResource))
      return new ResourcePlannings()

    return new ResourcePlannings(planningsForResource)
  }



  filterByScheduleDateRange(scheduleId: string, from: Date | number, to: Date | number): ResourcePlannings {

    let fromNum = from instanceof Date ? DateHelper.yyyyMMddhhmmss(from) : from
    let toNum = to instanceof Date ? DateHelper.yyyyMMddhhmmss(to) : to

    let plannings = this.plannings.filter(rp => rp.scheduleId == scheduleId && rp.end > fromNum && rp.start < toNum)

    return new ResourcePlannings(plannings)
  }

  filterBySchedulesDateRange2(scheduleIds: string[], from: Date | number, to: Date | number): ResourcePlannings {

    let fromNum = from instanceof Date ? DateHelper.yyyyMMddhhmmss(from) : from
    let toNum = to instanceof Date ? DateHelper.yyyyMMddhhmmss(to) : to

    let plannings = this.plannings.filter(rp => rp.scheduleId && scheduleIds.indexOf(rp.scheduleId) >= 0 && rp.end > fromNum && rp.start < toNum)

    return new ResourcePlannings(plannings)
  }

  /**
   *  example use: given all schedules for a branch (default opening hours, holidays, special openings,... -> defined by scheduleIds), return only
   *  those (resource plannings=schedules & their date-ranges) during a certain interval
   * @param scheduleIds 
   * @param dateRange 
   * @returns 
   */
  filterBySchedulesDateRange(scheduleIds: string[], dateRange: DateRange): ResourcePlannings {

    if (!Array.isArray(scheduleIds) || scheduleIds.length == 0)
      return new ResourcePlannings()

    const fromNum = dateRange.fromToNum()
    const toNum = dateRange.toToNum()

    let planningsForSchedules = this.plannings.filter(rp => rp.scheduleId && scheduleIds.indexOf(rp.scheduleId) >= 0
      && rp.end && rp.end > fromNum && rp.start && rp.start < toNum)

    if (!Array.isArray(planningsForSchedules))
      return new ResourcePlannings()

    planningsForSchedules = _.orderBy(planningsForSchedules, 'start')

    return new ResourcePlannings(planningsForSchedules)
  }

  filterBySchedulesDate(scheduleIds: string[], date: Date): ResourcePlanning {

    if (!Array.isArray(scheduleIds) || scheduleIds.length == 0)
      return undefined

    const dateNum = DateHelper.yyyyMMddhhmmss(date) //dateRange.fromToNum()

    let planningsForSchedules = this.plannings.filter(rp => rp.scheduleId && scheduleIds.indexOf(rp.scheduleId) >= 0
      && rp.start && rp.end && rp.start <= dateNum && dateNum < rp.end)

    if (!Array.isArray(planningsForSchedules) || planningsForSchedules.length == 0)
      return undefined

    return planningsForSchedules[0]
  }

  isFullAvailable(): boolean {
    const unavailable = this.plannings.find(rp => rp.act && !rp.available && !rp.scheduleId)

    return unavailable ? false : true
  }

  isPrepTimeOnly(): boolean {

    // try to find a planning that is NOT a preparation
    const nonPrep = this.plannings.find(rp => rp.act && !rp.prep)

    return nonPrep ? false : true
  }


  filterByAvailable(available = true): ResourcePlannings {

    const result = this.plannings.filter(rp => rp.available == available && !rp.scheduleId && rp.start && rp.end && rp.end >= rp.start)

    if (!Array.isArray(result))
      return new ResourcePlannings()

    return new ResourcePlannings(result)
  }

  toDateRangeSet(): DateRangeSet {

    if (ArrayHelper.IsEmpty(this.plannings))
      return new DateRangeSet()

    const dateRanges = this.plannings.map(rp => rp.toDateRange())
    const set = new DateRangeSet(dateRanges)
    return set

  }

  /** get resource group ids that are not allocated to specific resource */
  getGroupOnlyPlanningIds(): string[] {

    if (ArrayHelper.IsEmpty(this.plannings))
      return []

    let groupIds = this.plannings.filter(pl => StringHelper.isDefined(pl.resourceGroupId) && StringHelper.isNullOrUndefined(pl.resourceId)).map(pl => pl.resourceGroupId)

    groupIds = _.uniq(groupIds)

    return groupIds
  }

  groupByResource(): _.Dictionary<ResourcePlanning[]> {

    // const map = new Map<Resource, ResourcePlanning[]>()


    const map = _.groupBy(this.plannings, 'resourceId')

    return map

  }
}


export class PlanningProductOptionInfo {

  nm?: string
  val?: unknown
}

export class PlanningProductInfo {
  /** name */
  nm?: string

  @Type(() => PlanningProductOptionInfo)
  options?: PlanningProductOptionInfo[] = []


  constructor(productName?: string) {
    this.nm = productName
  }
}


export class PlanningContactInfo {

  /** first name */
  fst?: string

  /** last name */
  lst?: string

}


export class PlanningResourceInfo {
  /** name */
  nm?: string

  tp?: ResourceType

  constructor(resourceName?: string, resourceType?: ResourceType) {
    this.nm = resourceName
    this.tp = resourceType
  }
}



export class PlanningInfo {

  /** product info */
  @Type(() => PlanningProductInfo)
  prods: PlanningProductInfo[] = []

  /** contact (customer) info */
  @Type(() => PlanningContactInfo)
  cont?: PlanningContactInfo

  /** resource info */
  @Type(() => PlanningResourceInfo)
  res?: PlanningResourceInfo

  constructor(productInfo: PlanningProductInfo, contactInfo?: PlanningContactInfo, resourceInfo?: PlanningResourceInfo) {
    this.prods.push(productInfo)

    this.cont = contactInfo
    this.res = resourceInfo
  }

  toString(): string {

    let info = ``

    if (Array.isArray(this.prods)) {

      this.prods.forEach(prod => {
        info += `${prod.nm}`
      })
    }

    /*     if (this.res) {
          info += ` ${this.res.nm}`
        } */

    return info
  }


}


export class ResourcePlanning extends ObjectWithIdPlus implements IAsDbObject<ResourcePlanning> {
  branchId?: string;

  @Type(() => Resource)
  resource?: Resource //| ConnectTo
  resourceId?: string;

  @Type(() => Resource)
  resourceGroup?: Resource;
  resourceGroupId?: string;

  orderId?: string
  @Type(() => Order)
  order?: Order;

  orderLineId?: string;
  @Type(() => OrderLine)
  orderLine?: OrderLine;

  autoResourceId?: string;


  @Type(() => Schedule)
  schedule?: Schedule | ConnectTo
  scheduleId?: string;

  /** label coming from ProductResource */
  label?: string

  /** stored as JSON in database */
  @Type(() => PlanningInfo)
  info?: PlanningInfo

  type = PlanningType.occ

  start?: number = DateHelper.yyyyMMddhhmmss(new Date())
  end?: number = DateHelper.yyyyMMddhhmmss(new Date())

  /** is preperation time (before or after actual treatment) */
  prep: boolean = false

  /** overlap allowed (used if prep=true). Example: when cleaning of wellness can overlap the preparation of the next session */
  overlap: boolean = false

  // service?: string;
  // customer?: string;
  pre = 0
  post = 0



  asDbObject(): DbObjectCreate<ResourcePlanning> {
    return new DbObjectCreate<ResourcePlanning>('resourcePlanning', ResourcePlanning, this)
  }

  clone(): ResourcePlanning {

    return ObjectHelper.clone(this, ResourcePlanning)
  }

  get available(): boolean {
    return (this.type === PlanningType.avl)
  }

  get startUtc() {
    const start = DateHelper.parse(this.start)
    return TimeHelper.hhmmUTC(start)
  }

  set startUtc(val: string) {
    const start = TimeHelper.hhmmUTCToDate(val)
    this.start = DateHelper.yyyyMMdd000000(start)

  }


  set startDate(value: Date) {
    this.start = DateHelper.yyyyMMddhhmmss(value)
    console.warn(this.start)
  }

  get startDate() {
    return DateHelper.parse(this.start)
  }

  get startHour(): string {
    let hour = dateFns.format(this.startDate, 'HH:mm')    //DateHelper.parse(this.start)

    return hour
  }

  setDates(range: DateRange) {
    if (!range)
      return

    this.startDate = range.from
    this.endDate = range.to
  }

  /**
   * 
   * @param newStartHour format HH:mm
   */
  changeStartHour(newStartHour: string, updateEndDate: boolean = true): Date {

    if (!newStartHour)
      return null

    let items = newStartHour.split(':')

    if (items.length != 2)
      return null

    let hour = + items[0]
    let min = + items[1]

    let startDate = this.startDate

    let newStart = dateFns.startOfDay(startDate)

    newStart = dateFns.addHours(newStart, hour)
    newStart = dateFns.addMinutes(newStart, min)

    this.startDate = newStart

    if (updateEndDate) {
      let durationSeconds = dateFns.differenceInSeconds(this.endDate, startDate)
      this.endDate = dateFns.addSeconds(newStart, durationSeconds)
    }

    return newStart
  }

  set endDate(value: Date) {
    this.end = DateHelper.yyyyMMddhhmmss(value)
  }

  get endDate() {
    return DateHelper.parse(this.end)
  }

  toDateRange(): DateRange {

    const range = DateRange.fromNumbers(this.start!, this.end!)

    range.tag = this.type

    return range
  }

  setResource(resource: Resource) {

    if (!resource)
      return

    this.resourceId = resource.id
    this.resource = resource

  }

}

