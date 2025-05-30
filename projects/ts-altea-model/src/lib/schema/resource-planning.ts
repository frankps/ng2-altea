import { Branch, Contact, DepositMode, Gift, Invoice, Order, OrderLine, OrderType, Organisation, PlanningMode, Product, ProductResource, ProductType, Resource, ResourceType, Schedule, Task, User } from "ts-altea-model";
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

  /** pre-determined occupations: example if we work with fixed cleaning blocks for welness (when we are abscent, then we preconfigure a mask of cleaning blocks with allocation on group level)*/
  mask = 'mask',

  /** holiday */
  hol = 'hol',

  /** holiday request */
  holReq = 'holReq',

  /** bank holiday */
  bnk = 'bnk',
  ill = 'ill',
  abs = 'abs',   // absence, not paid by employer
  edu = 'edu',
  avl = 'avl',    // available
  sch = 'sch',    // planning schedule

  /** presence: staff batches when coming in/going home */
  pres = 'pres',

  /**  break (such as lunch break): at work, but not working */
  brk = 'brk',

  /* task (such as a treatment) */
  tsk = 'tsk',

  /** compensation (for extra hours worked previously)   */
  comp = 'comp'

}


/** Manage multiple ResourcePlanning's  */
export class ResourcePlannings {

  constructor(public plannings: ResourcePlanning[] = []) {

  }

  toString(dateFormat: string = 'HH:mm'): string {
    return this.plannings.map(rp => rp.toString(dateFormat)).join(', ')
  }

  count() {
    if (ArrayHelper.IsEmpty(this.plannings))
      return 0

    return this.plannings.length
  }

  getIds(): string[] {

    if (this.isEmpty())
      return []

    return this.plannings.map(rp => rp.id)
  }

  getById(id: string): ResourcePlanning {
    return this.plannings.find(rp => rp.id == id)
  }

  push(...plannings: ResourcePlanning[]) {
    this.plannings.push(...plannings)
  }

  add(extraPlannings: ResourcePlannings) {


    if (!extraPlannings || extraPlannings.isEmpty())
      return

    this.plannings.push(...extraPlannings.plannings)

  }

  remove(planning: ResourcePlanning) {
    this.plannings = this.plannings.filter(p => p.id != planning.id)
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

  firstOfType(type: PlanningType): ResourcePlanning {
    return this.plannings.find(p => p.type == type)
  }

  filterByType(...types: PlanningType[]): ResourcePlannings {
    const plannings = this.plannings.filter(rp => types.indexOf(rp.type) >= 0)

    if (!Array.isArray(plannings))
      return new ResourcePlannings()

    return new ResourcePlannings(plannings)
  }

  filterByDateRange(range: DateRange): ResourcePlannings {

    let fromNum = range.fromToNum()
    let toNum = range.toToNum()

    const plannings = this.plannings.filter(rp => rp.end > fromNum && rp.start < toNum)

    if (!Array.isArray(plannings))
      return new ResourcePlannings()

    return new ResourcePlannings(plannings)
  }


  filterByRange(from: Date | number, to: Date | number): ResourcePlannings {

    let fromNum = from instanceof Date ? DateHelper.yyyyMMddhhmmss(from) : from
    let toNum = to instanceof Date ? DateHelper.yyyyMMddhhmmss(to) : to


    const plannings = this.plannings.filter(rp => rp.end > fromNum && rp.start < toNum)

    if (!Array.isArray(plannings))
      return new ResourcePlannings()

    return new ResourcePlannings(plannings)
  }


  filterByRangeType(from: Date | number, to: Date | number, ...types: PlanningType[]): ResourcePlannings {

    let fromNum = from instanceof Date ? DateHelper.yyyyMMddhhmmss(from) : from
    let toNum = to instanceof Date ? DateHelper.yyyyMMddhhmmss(to) : to


    const plannings = this.plannings.filter(rp => types.indexOf(rp.type) >= 0
      && rp.end > fromNum && rp.start < toNum)

    if (!Array.isArray(plannings))
      return new ResourcePlannings()

    return new ResourcePlannings(plannings)
  }


  findFirstOnStartDate(startDate: Date | number): ResourcePlanning {

    if (startDate instanceof Date)
      startDate = DateHelper.yyyyMMddhhmmss(startDate)

    const planning = this.plannings.find(rp => rp.start == startDate)
    return planning
  }

  findFirstStartingAfter(after: Date | number): ResourcePlanning {

    if (ArrayHelper.IsEmpty(this.plannings))
      return null

    let afterNum: number

    if (after instanceof Date)
      afterNum = DateHelper.yyyyMMddhhmmss(after)
    else
      afterNum = after

    let plannings: ResourcePlanning[] = _.orderBy(this.plannings, 'start')

    const planning = plannings.find(rp => rp.start && rp.start > afterNum)

    return planning
  }

  findFirstEndingAfter(after: Date | number): ResourcePlanning {

    if (ArrayHelper.IsEmpty(this.plannings))
      return null

    let afterNum: number

    if (after instanceof Date)
      afterNum = DateHelper.yyyyMMddhhmmss(after)
    else
      afterNum = after

    let plannings: ResourcePlanning[] = _.orderBy(this.plannings, 'end')

    const planning = plannings.find(rp => rp.end && rp.end > afterNum)

    return planning
  }

  findLastEndingBefore(before: Date | number): ResourcePlanning {

    if (ArrayHelper.IsEmpty(this.plannings))
      return null

    let beforeNum: number

    if (before instanceof Date)
      beforeNum = DateHelper.yyyyMMddhhmmss(before)
    else
      beforeNum = before

    let plannings = _.orderBy(this.plannings, ['end'], ['desc'])

    const planning = plannings.find(rp => rp.end && rp.end < beforeNum)

    return planning
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

      if (range2Idx == -1) {
        result.push(planning1)
        continue
      }

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

  filterByResource(resourceId: string, isGroup = false): ResourcePlannings {

    let planningsForResource

    if (isGroup)
      planningsForResource = this.plannings.filter(rp => rp.resourceGroupId == resourceId)
    else
      planningsForResource = this.plannings.filter(rp => rp.resourceId == resourceId)

    if (!Array.isArray(planningsForResource))
      return new ResourcePlannings()

    return new ResourcePlannings(planningsForResource)
  }

  filterByResourceType(resourceId: string, ...types: PlanningType[]): ResourcePlannings {

    const planningsForResource = this.plannings.filter(rp => rp.resourceId == resourceId && types.indexOf(rp.type) >= 0)

    if (!Array.isArray(planningsForResource))
      return new ResourcePlannings()

    return new ResourcePlannings(planningsForResource)
  }

  filterByOverruleScheduleDay(overrule: boolean = true): ResourcePlannings {

    const filtered = this.plannings.filter(rp => rp.ors == overrule)

    if (!Array.isArray(filtered))
      return new ResourcePlannings()

    return new ResourcePlannings(filtered)
  }

  filterByOverlapAllowed(overlap: boolean = false): ResourcePlannings {

    // Debugging

    /*
    let debug = this.plannings.filter(rp => rp.resourceId == resourceId)

    debug = _.sortBy(debug, 'start')

    console.error(debug)
    */

    const planningsForResource = this.plannings.filter(rp => rp.overlap == overlap && !rp.scheduleId)

    if (!Array.isArray(planningsForResource))
      return new ResourcePlannings()

    return new ResourcePlannings(planningsForResource)
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

  filterByResourceGroupsOnly(type?: PlanningType) {

    const planningsForResource = this.plannings.filter(rp => rp.resourceGroupId && !rp.resourceId && (!type || rp.type == type))

    return new ResourcePlannings(planningsForResource)
  }

  filterByDateRangeResourceGroupsOnly(groupResourceIds: string[], from: Date | number, to: Date | number): ResourcePlannings {

    let fromNum = from instanceof Date ? DateHelper.yyyyMMddhhmmss(from) : from
    let toNum = to instanceof Date ? DateHelper.yyyyMMddhhmmss(to) : to

    const debug = this.plannings.filter(rp => rp.resourceGroupId && !rp.resourceId &&
      rp.end > fromNum && rp.start < toNum)

    // console.error(debug)

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

  filterBySchedulesDateRange2(scheduleIds: string[], from: Date | number, to: Date | number, ...resourceIds: string[]): ResourcePlannings {

    let fromNum = from instanceof Date ? DateHelper.yyyyMMddhhmmss(from) : from
    let toNum = to instanceof Date ? DateHelper.yyyyMMddhhmmss(to) : to

    let plannings = this.plannings.filter(rp => rp.scheduleId && scheduleIds.indexOf(rp.scheduleId) >= 0 && rp.end > fromNum && rp.start < toNum)

    if (ArrayHelper.NotEmpty(resourceIds)) {
      plannings = plannings.filter(rp => resourceIds.indexOf(rp.resourceId) >= 0)
    }

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

  filterByScheduleDate(scheduleId: string, date: Date): ResourcePlanning {

    if (!scheduleId || !date)
      return undefined

    const dateNum = DateHelper.yyyyMMddhhmmss(date) //dateRange.fromToNum()

    let planningsForSchedules = this.plannings.filter(rp => rp.scheduleId == scheduleId
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

  getGroupPlannings(type?: PlanningType): ResourcePlannings {

    if (this.isEmpty())
      return new ResourcePlannings()

    let plannings = this.plannings.filter(pl => pl.resourceGroupId != null && (!type || pl.type == type))

    return new ResourcePlannings(plannings)
  }

  getGroupPlanning(resourceGroupId: string, minStart: number, maxEnd: number, type?: PlanningType) {

    if (this.isEmpty())
      return null

    let planning = this.plannings.find(pl => pl.resourceGroupId == resourceGroupId
      && (!type || pl.type == type)
      && pl.start >= minStart && pl.end <= maxEnd)

    return planning
  }

  groupByResource(): _.Dictionary<ResourcePlanning[]> {

    // const map = new Map<Resource, ResourcePlanning[]>()


    const map = _.groupBy(this.plannings, 'resourceId')

    let groupMap = _.groupBy(this.plannings, 'resourceGroupId')

    if (groupMap) {
      for (const groupId in groupMap) {

        if (groupId != 'null')
          map[groupId] = groupMap[groupId]

      }
    }
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

  taskId?: string;
  @Type(() => Task)
  task?: Task;

  @Type(() => Schedule)
  schedule?: Schedule | ConnectTo
  scheduleId?: string;

  /** label coming from ProductResource */
  label?: string

  /** stored as JSON in database */
  @Type(() => PlanningInfo)
  info?: PlanningInfo

  /** remark */
  rem?: string

  type = PlanningType.occ

  start?: number = DateHelper.yyyyMMddhhmmss(new Date())
  end?: number = DateHelper.yyyyMMddhhmmss(new Date())

  /** date format: 
   *  's': second format, start & end have format yyyyMMddhhmmss
   *  'd': hour format, UI just works with dates (not hours), start has format yyyyMMdd000000, end has format yyyyMMdd235959
  */
  fmt?: undefined | null | 's' | 'd'

  /** is preperation time (before or after actual treatment) */
  prep: boolean = false

  /** Overrule schedule: used to overrule a normal day schedule of (for instance) staff member. So schedule will not be used, instead we use
   * this record (planning type: avl)
   */
  ors: boolean = false

  /** overlap allowed, used if: 
   *     (1) prep=true Example: when cleaning of wellness can overlap the preparation of the next session 
   *     (2) if task (taskId is set): if true, then new bookings can overlap with this task
   * */
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

  set endDate(value: Date) {
    this.end = DateHelper.yyyyMMddhhmmss(value)
  }

  get endDate() {
    return DateHelper.parse(this.end)
  }

  set fullDays(value: boolean) {
    this.fmt = value ? 'd' : 's'
  }

  @Exclude()
  get fullDays() {
    return this.fmt == 'd'
  }

  dateFormat() {
    return this.fmt == 'd' ? 'dd/MM/yyyy' : 'dd/MM/yyyy HH:mm'
  }

  setDates(range: DateRange) {
    if (!range)
      return

    this.startDate = range.from
    this.endDate = range.to
  }

  nrOfDays() {

    let start = this.startDate
    let end = this.endDate

    if (DateHelper.isDate(start) && DateHelper.isDate(end)) {
      let days = dateFns.differenceInDays(end, start) + 1
      return days
    } else
      return -1
  }

  timeBetween(other: ResourcePlanning): TimeSpan {

    if (!other)
      return null

    if (other.start > this.end)
      return TimeSpan.between(this.endDate, other.startDate)
    else if (other.end < this.start)
      return TimeSpan.between(other.endDate, this.startDate)
    else
      return TimeSpan.zero

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



  toDateRange(): DateRange {

    const range = DateRange.fromNumbers(this.start!, this.end!)

    range.tag = this.type

    return range
  }

  toDateRangeSet(): DateRangeSet {

    return new DateRangeSet([this.toDateRange()])
  }

  setResource(resource: Resource) {

    if (!resource)
      return

    this.resourceId = resource.id
    this.resource = resource

  }

  override toString(dateFormat: string = 'HH:mm'): string {   //  'dd/MM HH:mm'

    let full = this.ors ? ' FULL-DAY' : ''

    return `[${this.type}: ${dateFns.format(this.startDate, dateFormat)}-${dateFns.format(this.endDate, dateFormat)}${full}]`

  }

}

