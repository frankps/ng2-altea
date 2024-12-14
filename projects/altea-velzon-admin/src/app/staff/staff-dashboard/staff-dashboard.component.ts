import { Component, OnInit } from '@angular/core';
import { OrderService, ResourcePlanningService, SessionService } from 'ng-altea-common';
import { AppComponent } from '../../app.component';
import { TranslationService } from 'ng-common'
import { ResourcePlanning, PlanningType, Resource } from 'ts-altea-model';
import { ArrayHelper, DateHelper, DbQuery, QueryOperator } from 'ts-common';
import * as dateFns from 'date-fns'


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

  }



  clearData() {
    
    this.staffMember = null
    this.plannings = []
    this.presence = null
    this.break = null

    this.showHolidays = false
    this.holidays = []
    this.holidayRequests = []
  }

  async showPlannings(resource: Resource) {

    this.clearData()

    this.staffMember = resource

    let resourceId = resource.id

    var qry = new DbQuery()

    qry.and("branchId", QueryOperator.equals, this.sessionSvc.branchId)
    qry.and("resourceId", QueryOperator.equals, resourceId)
    qry.and("type", QueryOperator.in, ['brk', 'pres'])

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

    let holidayRequest = new ResourcePlanning()

    holidayRequest.branchId = this.sessionSvc.branchId
    holidayRequest.resourceId = this.sessionSvc.humanResource.id
    holidayRequest.type = PlanningType.holReq

    let start = this.holidayDateRange[0]
    let end = this.holidayDateRange[1]
  

    holidayRequest.start = DateHelper.yyyyMMdd000000(start)
    holidayRequest.end = DateHelper.yyyyMMddxxxxxx(end, '235959')

    holidayRequest.fmt = 'd'

    var planningCreated = await this.planningSvc.create$(holidayRequest)

    console.log(planningCreated)

    if (planningCreated.isOk) {
      this.holidayRequests.push(holidayRequest)
    }

  }

  async toggleHolidays() {

    if (!this.staffMember)
      return

    this.showHolidays = !this.showHolidays

    await this.getHolidays(this.staffMember.id)

  }


  async getHolidays(resourceId: string) {

    this.holidays = []
    this.holidayRequests = []


    var qry = new DbQuery()

    qry.and("branchId", QueryOperator.equals, this.sessionSvc.branchId)
    qry.and("resourceId", QueryOperator.equals, resourceId)
    qry.and("type", QueryOperator.in, ['hol', 'holReq'])


    let startOfDay = dateFns.startOfDay(new Date())
    let startOfDayNum = DateHelper.yyyyMMddhhmmss(startOfDay)


    qry.and("start", QueryOperator.greaterThanOrEqual, startOfDayNum)


    let holidays = await this.planningSvc.query$(qry)

    if (ArrayHelper.NotEmpty(this.plannings)) {

      this.holidays = holidays.filter(p => p.type == PlanningType.hol)
      this.holidayRequests = holidays.filter(p => p.type == PlanningType.holReq)
    }

    console.log('getHolidays', this.holidays, this.holidayRequests)

    this.init = true

  }


}
