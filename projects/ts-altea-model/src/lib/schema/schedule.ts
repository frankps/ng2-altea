

import { Branch,  DaysOfWeekShort,  DepositMode, Gender, Gift, Invoice, LoyaltyCard, Order, OrderLine, OrderType, Organisation, PlanningMode, Product, ProductResource, ProductType, Resource, ResourcePlanning, Subscription, User, UserBase } from "ts-altea-model";
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


export class HourMinute {
    hour = 0
    minute = 0
  
    static parse(time: string): HourMinute {
  
      const hm = new HourMinute()
  
      const items = time.split(':')
  
      hm.hour = Number(items[0])
      hm.minute = Number(items[1])
  
      return hm
  
    }
  }

export class ScheduleTimeBlock {
    from = '09:00'  // format HH:mm
    to = '17:00'
  
    clone(): ScheduleTimeBlock {
      const block = new ScheduleTimeBlock()
  
      block.from = this.from
      block.to = this.to
  
      return block
    }
  
    fromParse(): HourMinute {
      return HourMinute.parse(this.from)
    }
  
    toParse(): HourMinute {
      return HourMinute.parse(this.to)
    }
  
  
  }
  

export class DaySchedule {
    idx = -1
    on = true  // equals is active  
    day: DaysOfWeekShort = DaysOfWeekShort.mo
  
    @Type(() => ScheduleTimeBlock)
    blocks: ScheduleTimeBlock[] = []
  
    constructor(day: DaysOfWeekShort = DaysOfWeekShort.mo, idx = 0, on = true) {
      this.day = day
      this.idx = idx
      this.on = on
    }
  
    removeBlock(block: ScheduleTimeBlock) {
  
      if (!block)
        return
  
      if (this.blocks)
        _.remove(this.blocks, b => b.from == block.from && b.to == block.to)
  
  
    }
  }
  


export class WeekSchedule {
    idx = -1
  
    @Type(() => DaySchedule)
    days: DaySchedule[] = []
  
    constructor(weekIdx: number, startAtDayIdx = 1) {
  
      this.idx = weekIdx
      const days = Object.values(DaysOfWeekShort);
      let dayIdx = startAtDayIdx
      let active = true
  
      // monday=1, sunday=7
      for (let day = 1; day <= 7; day++) {
  
        if (day == DaysOfWeekShort.sa)
          active = false
  
        const daySchedule = new DaySchedule(day, dayIdx, active)
  
        if (active)
          daySchedule.blocks.push(new ScheduleTimeBlock())
  
        this.days.push(daySchedule)
        dayIdx++
      }
  
  
  
    }
  
    /**
     * 
     * @param dayOfWeek 0=sunday ... 6=saturday
     */
    // getDay(dayOfWeek: number) {
  
  
    // }
  
  
    getDaySchedule(dayOfWeek: number): DaySchedule | undefined {
  
      if (!Array.isArray(this.days))
        return undefined
  
      const dayOfWeekEnum = this.getDaysOfWeekShort(dayOfWeek)
      return this.days.find(d => d.day == dayOfWeekEnum)
  
    }
  
  
    /**
     * 
     * @param dayOfWeek 0=sunday ... 6=saturday
     */
    getDaysOfWeekShort(dayOfWeek: number): DaysOfWeekShort {
  
      switch (dayOfWeek) {
        case 0: return DaysOfWeekShort.su
        case 1: return DaysOfWeekShort.mo
        case 2: return DaysOfWeekShort.tu
        case 3: return DaysOfWeekShort.we
        case 4: return DaysOfWeekShort.th
        case 5: return DaysOfWeekShort.fr
        case 6: return DaysOfWeekShort.sa
      }
  
      return DaysOfWeekShort.su
    }
  
  }
  


export class Schedule extends ObjectWithIdPlus {

    idx = 0
    default = false
  
    branchId?: string;
  
    //@Type(() => Resource)
    resource?: Resource;
    resourceId?: string;
    name?: string;
  
    // @Type(() => ScheduleLine)
    // lines?: ScheduleLine[];
  
    @Type(() => ResourcePlanning)
    planning?: ResourcePlanning[]
  
  
    /** re-use the plannings from these branch schedule ids  */
    scheduleIds: string[] = []
  
  
    //scheduling?: Scheduling[];
  
    // the start of the week schedules (if weeks.length > 1), format: yyyymmdd
    start?: number;
  
    @Type(() => WeekSchedule)
    weeks?: WeekSchedule[] = []
  
    /** Includes preparation time: extra work needed before & after actual booking such as prepartions before booking or cleaning time after is included in this schedule (=> system can not go outside given timings for preparations).
     *  If true: possible preparations (defined via ProductResource, prep=true) must fall within this schedule 
     */
    prepIncl: boolean = true
  
  
    /*
    set startDate(value: Date) {
      this.start = DateHelper.yyyyMMdd(value)
      console.warn(this.start)
    }
  */
    startDate() {
      return DateHelper.parse(this.start)
    }
  
  
  
  
    isInsideSchedule(dateRange: DateRange) {
  
      let start = dateFns.startOfDay(dateRange.from)
      let end = dateFns.endOfDay(dateRange.to)
  
      let scheduleRanges = this.toDateRangeSet(start, end)
  
      let contains = scheduleRanges.contains(dateRange)
  
      return contains
    }
  
    /** returns the date ranges of the given dateRange that are outside schedule */
    outsideSchedule(dateRange: DateRange): DateRangeSet {
  
      let start = dateFns.startOfDay(dateRange.from)
      let end = dateFns.endOfDay(dateRange.to)
  
      let scheduleRanges = this.toDateRangeSet(start, end)
  
      let outside = dateRange.subtractSet(scheduleRanges)
  
      return outside
    }
  
    /** returns the date ranges of the given dateRange outside schedule */
    insideSchedule(dateRange: DateRange): DateRangeSet {
  
      return DateRangeSet.empty
    }
  
    getDaySchedule(day: Date): DaySchedule {
      const daySchedule = new DaySchedule()
      daySchedule.blocks.push(new ScheduleTimeBlock())
      return daySchedule
    }
  
    toDateRangeSet(from: Date | number, to: Date | number, fromLabel?: string, toLabel?: string): DateRangeSet {
  
      // 
      const dateRangeSet = new DateRangeSet()
  
  
      if (!this.weeks || this.weeks.length == 0)
        return dateRangeSet
  
      let fromDate, toDate: Date
  
      if (DateHelper.isDate(from))
        fromDate = from as Date
      else
        fromDate = DateHelper.parse(from)
  
      if (DateHelper.isDate(to))
        toDate = to as Date
      else
        toDate = DateHelper.parse(to)
  
      const days = dateFns.eachDayOfInterval({ start: fromDate, end: toDate })
  
      let currentWeekIdx = 0
      let nrOfWeeks = this.weeks.length
  
      /**
       * if a multi week schedule, then calculate the current week inside this multi-week schedule (currentWeekIdx)
       */
      if (this.weeks.length > 1) {
        let startOfWeekSchedule = this.startDate()
        let weekDif = dateFns.differenceInWeeks(fromDate, startOfWeekSchedule)
  
        console.warn(weekDif)
  
        if (fromDate >= startOfWeekSchedule && weekDif >= 0) {
          currentWeekIdx = weekDif % nrOfWeeks
  
          if (Number.isNaN(currentWeekIdx))
            console.log('currentWeekIdx is NaN')
        }
        else {  // if fromDate is before startOfWeekSchedule
          weekDif = Math.abs(weekDif) % nrOfWeeks
          currentWeekIdx = nrOfWeeks - 1 - weekDif
  
          if (Number.isNaN(currentWeekIdx))
            console.log('currentWeekIdx is NaN')
        }
      }
  
  
      const toDateMillis = toDate.getTime()
  
      for (const dayDate of days) {
  
        if (dayDate.getTime() == toDateMillis) // if toDate is start of new day, then we're not interested in that day
          break
  
        const weekSchedule = this.weeks[currentWeekIdx]
        const dayOfWeek = dayDate.getDay()
  
        if (!weekSchedule) {
          console.warn('No week schedule!')
        }
  
  
        const daySchedule = weekSchedule.getDaySchedule(dayOfWeek)
  
        if (daySchedule?.on && Array.isArray(daySchedule.blocks)) {
  
  
          for (const block of daySchedule.blocks) {
  
            const from: HourMinute = block.fromParse()
            let fromDate = dateFns.addHours(dayDate, from.hour)
            fromDate = dateFns.addMinutes(fromDate, from.minute)
  
            const to: HourMinute = block.toParse()
            let toDate = dateFns.addHours(dayDate, to.hour)
            toDate = dateFns.addMinutes(toDate, to.minute)
  
            let range = dateRangeSet.addRangeByDates(fromDate, toDate, fromLabel, toLabel)
            range.schedule = this
  
          }
  
  
        }
  
        // if sunday
        if (nrOfWeeks > 1 && (dayOfWeek % 7) == 0) {
          currentWeekIdx = (currentWeekIdx + 1) % nrOfWeeks
        }
  
        // daySchedule?.blocks
  
      }
  
  
  
  
  
      return dateRangeSet
  
    }
  }
  