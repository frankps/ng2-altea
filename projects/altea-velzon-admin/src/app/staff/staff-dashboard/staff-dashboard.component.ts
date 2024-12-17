import { Component, OnInit } from '@angular/core';
import { OrderService, ResourcePlanningService, SessionService } from 'ng-altea-common';
import { AppComponent } from '../../app.component';
import { TranslationService } from 'ng-common'
import { ResourcePlanning, PlanningType, Resource, ResourceRequest } from 'ts-altea-model';
import { ArrayHelper, DateHelper, DbQuery, QueryOperator } from 'ts-common';
import * as dateFns from 'date-fns'
import * as _ from "lodash";

export class HolidayApproval {

  /** the holiday request */
  request: ResourcePlanning

  //approved: boolean = false
  issues: string[] = []

  constructor(request: ResourcePlanning, public approved: boolean = false) {
    this.request = request

  }

}


@Component({
  selector: 'app-staff-dashboard',
  templateUrl: './staff-dashboard.component.html',
  styleUrls: ['./staff-dashboard.component.scss']
})
export class StaffDashboardComponent implements OnInit {

  init = false
  breakStarted = false
  staffMember: Resource

  plannings: ResourcePlanning[] = []

  presence: ResourcePlanning = null

  break: ResourcePlanning = null

  debugAddDays = 0

  showHolidays: boolean = false
  holidays: ResourcePlanning[] = []
  holidayRequests: ResourcePlanning[] = []

  // we try to auto approve any new incoming request
  autoApprove: HolidayApproval

  constructor(protected sessionSvc: SessionService, protected appComponent: AppComponent, protected translationSvc: TranslationService, protected planningSvc: ResourcePlanningService, protected orderSvc: OrderService) {

  }


  async ngOnInit() {

    let resource = this.sessionSvc.humanResource

    if (resource)
      await this.showPlannings(resource)

    this.appComponent.userSelect.select.subscribe(async staffMember => {

      if (!staffMember)
        return

      await this.showPlannings(staffMember)

    })


    if (!this.sessionSvc.humanResource)
      this.changeUser()

  }



  clearData() {

    this.staffMember = null
    this.plannings = []
    this.presence = null
    this.break = null

    this.clearHolidayData()
  }


  clearHolidayData() {
    this.showHolidays = false
    this.holidays = []
    this.holidayRequests = []
    this.autoApprove = null
  }


  async showPlannings(resource: Resource) {

    this.clearData()

    this.staffMember = resource

    let resourceId = resource.id

    var qry = new DbQuery()

    qry.and("branchId", QueryOperator.equals, this.sessionSvc.branchId)
    qry.and("resourceId", QueryOperator.equals, resourceId)
    qry.and("type", QueryOperator.in, ['brk', 'pres'])
    qry.and("act", QueryOperator.equals, true)

    let startOfDay = dateFns.startOfDay(new Date())
    let startOfDayNum = DateHelper.yyyyMMddhhmmss(startOfDay)

    let endOfDay = dateFns.endOfDay(new Date())
    let endOfDayNum = DateHelper.yyyyMMddhhmmss(endOfDay)

    qry.and("start", QueryOperator.greaterThanOrEqual, startOfDayNum)
    qry.and("start", QueryOperator.lessThanOrEqual, endOfDayNum)


    /*
        var breakOrPresence = qry.or()
        breakOrPresence.and("type", QueryOperator.in, ['brk', 'pres'])
    */

    this.plannings = await this.planningSvc.query$(qry)

    if (ArrayHelper.NotEmpty(this.plannings)) {

      this.presence = this.plannings.find(p => p.type == PlanningType.pres)
      this.break = this.plannings.find(p => p.type == PlanningType.brk)

    }

    console.log('showPlannings', this.plannings, this.presence, this.break)

    this.init = true

  }

  /** Create a staff service containing all resource plannings for today */

  userName(): string {

    if (this.sessionSvc.humanResource)
      return this.sessionSvc.humanResource.shortOrName()
    else
      return 'Geen gebruiker'

  }

  changeUser() {
    this.appComponent.userSelect.show()
  }

  async startOfDay() {

    let dayPresence = new ResourcePlanning()

    dayPresence.branchId = this.sessionSvc.branchId
    dayPresence.resourceId = this.sessionSvc.humanResource.id
    dayPresence.type = PlanningType.pres   // break type

    let start = new Date()

    if (this.debugAddDays)
      start = dateFns.addDays(start, this.debugAddDays)

    dayPresence.start = DateHelper.yyyyMMddhhmmss(start)
    dayPresence.end = null

    var planningCreated = await this.planningSvc.create$(dayPresence)
    console.warn(planningCreated)

    if (planningCreated.isOk) {
      this.presence = dayPresence

    }

  }

  async endOfDay() {

    if (!this.presence)
      return

    let end = new Date()

    if (this.debugAddDays)
      end = dateFns.addDays(end, this.debugAddDays)

    this.presence.end = DateHelper.yyyyMMddhhmmss(end)
    this.presence.markAsUpdated('end')

    var planningUpdated = await this.planningSvc.update$(this.presence)
    console.warn(planningUpdated)  // planningUpdated

  }



  async startBreak() {
    console.error("start break")

    console.log(this.sessionSvc.humanResource)

    let breakPlanning = new ResourcePlanning()

    breakPlanning.branchId = this.sessionSvc.branchId
    breakPlanning.resourceId = this.sessionSvc.humanResource.id
    breakPlanning.type = PlanningType.brk   // break type


    let start = new Date()

    if (this.debugAddDays)
      start = dateFns.addDays(start, this.debugAddDays)

    let end = dateFns.addMinutes(start, 30)

    breakPlanning.start = DateHelper.yyyyMMddhhmmss(start)
    breakPlanning.end = DateHelper.yyyyMMddhhmmss(end)

    var planningCreated = await this.planningSvc.create$(breakPlanning)
    console.warn(planningCreated)

    if (planningCreated.isOk) {

      this.break = breakPlanning

      var pushedToFirebase = await this.orderSvc.pushPlanningToFirebase(planningCreated.object.id)
      console.warn(pushedToFirebase)

      this.breakStarted = true

    }
  }



  holidayDateRange: Date[]

  rangePickerChanged(event: any) {

    console.error(event)

  }


  async requestHoliday() {

    let me = this

    let holidayRequest = new ResourcePlanning()

    holidayRequest.branchId = me.sessionSvc.branchId
    holidayRequest.resourceId = me.sessionSvc.humanResource.id
    holidayRequest.type = PlanningType.holReq

    let start = me.holidayDateRange[0]
    let end = me.holidayDateRange[1]


    holidayRequest.start = DateHelper.yyyyMMdd000000(start)
    holidayRequest.end = DateHelper.yyyyMMddxxxxxx(end, '235959')

    holidayRequest.fmt = 'd'

    me.autoApprove = await me.autoApproveHolidayRequest(holidayRequest)

    if (me.autoApprove.approved) {
      holidayRequest.type = PlanningType.hol
    }

    var planningCreated = await me.planningSvc.create$(holidayRequest)

    console.log(planningCreated)

    if (planningCreated.isOk) {

      if (holidayRequest.type == PlanningType.holReq)
        this.holidayRequests.push(holidayRequest)
      else  // in case holiday request was immmediatly approved
        this.holidays.push(holidayRequest)

      this.holidayDateRange = []
    }

  }

  async toggleHolidays() {

    this.clearHolidayData()

    if (!this.staffMember)
      return

    this.showHolidays = !this.showHolidays

    await this.getHolidays(this.staffMember.id)

  }

  hasHolidayRequests(): boolean {
    return ArrayHelper.NotEmpty(this.holidayRequests)
  }

  hasHolidays(): boolean {
    return ArrayHelper.NotEmpty(this.holidays)
  }

  async getHolidays(resourceId: string) {

    this.holidays = []
    this.holidayRequests = []


    var qry = new DbQuery()

    qry.and("branchId", QueryOperator.equals, this.sessionSvc.branchId)
    qry.and("resourceId", QueryOperator.equals, resourceId)
    qry.and("type", QueryOperator.in, ['hol', 'holReq'])
    qry.and("act", QueryOperator.equals, true)


    let startOfDay = dateFns.startOfDay(new Date())
    let startOfDayNum = DateHelper.yyyyMMddhhmmss(startOfDay)


    qry.and("start", QueryOperator.greaterThanOrEqual, startOfDayNum)


    let holidays = await this.planningSvc.query$(qry)

    if (ArrayHelper.NotEmpty(holidays)) {

      this.holidays = holidays.filter(p => p.type == PlanningType.hol)
      this.holidayRequests = holidays.filter(p => p.type == PlanningType.holReq)
    }

    console.log('getHolidays', holidays, this.holidays, this.holidayRequests)

    this.init = true

  }


  async countExistingPlanningsForStaffMember(holidayRequest: ResourcePlanning): Promise<number> {

    const qry = new DbQuery()

    qry.and('resourceId', QueryOperator.equals, holidayRequest.resourceId)
    qry.and('start', QueryOperator.greaterThanOrEqual, holidayRequest.start)
    qry.and('start', QueryOperator.lessThanOrEqual, holidayRequest.end)
    qry.and('type', QueryOperator.equals, PlanningType.occ)
    qry.and("act", QueryOperator.equals, true)

    let plannings = await this.planningSvc.query$(qry)

    return ArrayHelper.IsEmpty(plannings) ? 0 : plannings.length


  }

  async countHolidaysForOtherStaffMembers(holidayRequest: ResourcePlanning): Promise<number> {

    const qry = new DbQuery()

    qry.and('resourceId', QueryOperator.not, holidayRequest.resourceId)
    qry.and('start', QueryOperator.greaterThanOrEqual, holidayRequest.start)
    qry.and('start', QueryOperator.lessThanOrEqual, holidayRequest.end)
    qry.and('type', QueryOperator.equals, PlanningType.hol)
    qry.and("act", QueryOperator.equals, true)
    
    let plannings = await this.planningSvc.query$(qry)

    return ArrayHelper.IsEmpty(plannings) ? 0 : plannings.length


  }

  intervalHasSaturday(start: Date, end: Date): boolean {
    // Generate all days in the given interval
    const days = dateFns.eachDayOfInterval({ start, end });

    // Check if any of these days is a Saturday
    return days.some(day => dateFns.isSaturday(day));
  }

  async autoApproveHolidayRequest(holidayRequest: ResourcePlanning): Promise<HolidayApproval> {

    let approval = new HolidayApproval(holidayRequest, true)

    // first check if no bookings for staff member
    let numOfExistingPlannings = await this.countExistingPlanningsForStaffMember(holidayRequest)

    if (numOfExistingPlannings > 0) {
      approval.approved = false
      approval.issues.push(`Er zijn reeds ${numOfExistingPlannings} activiteiten op jouw naam gepland in de gevraagde periode.`)
    }

    // check if nobody else takes holidays
    let numOfHolidaysOthers = await this.countHolidaysForOtherStaffMembers(holidayRequest)

    if (numOfHolidaysOthers > 0) {
      approval.approved = false
      approval.issues.push(`Er zijn reeds ${numOfHolidaysOthers} andere verlofperiodes van andere collega's.`)
    }

    // check if saterday and less then 3 days (except Hèra)

    let start = holidayRequest.startDate
    let end = holidayRequest.endDate
    let nrOfDays = dateFns.differenceInDays(holidayRequest.endDate, holidayRequest.startDate) + 1 

    if (holidayRequest.resourceId != 'cc241d0c-b650-429c-86d6-f3cbd5c32e88' && nrOfDays < 3) {
      if (this.intervalHasSaturday(start, end)) {

        approval.approved = false
        approval.issues.push(`Deze korte periode bevat een zaterdag: check of je kan omwisselen met een collega.`)

      }


    }



    return approval
  }

  async deletePlanning(planning: ResourcePlanning, source: ResourcePlanning[]) {

    this.autoApprove = null

    let deleteResult = await this.planningSvc.delete$(planning.id)

    if (deleteResult.isOk) {

      _.remove(source, plan => plan.id == planning.id)

    }

  }

}
