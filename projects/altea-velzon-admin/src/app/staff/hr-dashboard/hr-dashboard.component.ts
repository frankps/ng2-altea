import { Component, OnInit } from '@angular/core';
import { ObjectService, OrderService, ResourcePlanningService, ResourceService, SessionService } from 'ng-altea-common';
import { AppComponent } from '../../app.component';
import { TranslationService } from 'ng-common'
import { ResourcePlanning, PlanningType, Resource, ResourceRequest, DateRange, DateRangeSet, TimeSpan } from 'ts-altea-model';
import { HtmlTable, ArrayHelper, DateHelper, DbQuery, QueryOperator } from 'ts-common';
import * as dateFns from 'date-fns'
import * as _ from "lodash";
import { AlteaDb, AlteaPlanningQueries } from 'ts-altea-logic';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-hr-dashboard',
  templateUrl: './hr-dashboard.component.html',
  styleUrls: ['./hr-dashboard.component.scss']
})
export class HrDashboardComponent implements OnInit {

  holidays: ResourcePlanning[] = []
  holidayRequests: ResourcePlanning[] = []

  init = false

  staff: Resource[]


  htmlReport: SafeHtml

  constructor(protected sessionSvc: SessionService, protected appComponent: AppComponent, protected translationSvc: TranslationService,
    protected planningSvc: ResourcePlanningService, protected orderSvc: OrderService, protected objectSvc: ObjectService, protected resourceSvc: ResourceService, protected sanitizer: DomSanitizer) {

  }


  async ngOnInit() {

    await this.getHolidays()

    this.staff = await this.resourceSvc.getHumanResources(null, ['schedules'])
  }



  async getHolidays() {

    this.holidays = []
    this.holidayRequests = []

    var qry = new DbQuery()

    qry.and("branchId", QueryOperator.equals, this.sessionSvc.branchId)
    qry.and("type", QueryOperator.in, ['hol', 'holReq'])
    qry.and("act", QueryOperator.equals, true)

    qry.include("resource")

    let startOfDay = dateFns.startOfDay(new Date())
    let startOfDayNum = DateHelper.yyyyMMddhhmmss(startOfDay)

    qry.and("start", QueryOperator.greaterThanOrEqual, startOfDayNum)

    let holidays = await this.planningSvc.query$(qry)

    if (ArrayHelper.NotEmpty(holidays)) {

      let hols = holidays.filter(p => p.type == PlanningType.hol)
      this.holidays = _.orderBy(hols, 'start')

      let requests = holidays.filter(p => p.type == PlanningType.holReq)
      this.holidayRequests = _.orderBy(requests, 'start')
    }

    console.log('getHolidays', holidays, this.holidays, this.holidayRequests)

    this.init = true

  }


  async approveHolidayRequest(request: ResourcePlanning) {



    let update = {
      id: request.id,
      type: PlanningType.hol
    }

    let res = await this.planningSvc.update$(update)

    if (res.isOk) {

      request.type = PlanningType.hol

      let removed = _.remove(this.holidayRequests, p => p.id == request.id)

      if (removed?.length == 1) {

        let holidays = this.holidays
        holidays.push(request)

        this.holidays = _.orderBy(holidays, 'start')

      }




    }


  }

  async deletePlanning(planning: ResourcePlanning, source: ResourcePlanning[]) {

    let update = {
      id: planning.id,
      act: false
    }

    let deleteResult = await this.planningSvc.update$(update)

    if (deleteResult.isOk) {
      _.remove(source, plan => plan.id == planning.id)
    }

  }


  async showMonthReport(resource: Resource) {


    let month = new Date(2025, 1, 1)

    console.error(resource, month)

    let monthReport = await this.makeMonthReport(resource, month)


    let htmlToShow = monthReport.toHtmlString()

    this.htmlReport = this.sanitizer.bypassSecurityTrustHtml(htmlToShow)
  }


  deviatesMoreThanXPercent(base: number, compare: number, x: number = 0.05): boolean {
    const threshold = base * x;
    return Math.abs(compare - base) > threshold;
  }



  async makeMonthReport(resource: Resource, start: Date): Promise<HtmlTable> {

    let table = new HtmlTable()

    table.headerRow = true

    table.styles.th = { 'padding-left': '20px' }
    table.styles.td = { 'padding-left': '20px' }
    let header: string[] = []
    table.addRow(header)


    start = dateFns.startOfMonth(start)
    let end = dateFns.endOfMonth(start)


    console.error(resource)

    var defaultSchedule = resource.schedules.find(schedule => schedule.default)

    if (!defaultSchedule) {
      console.error('No default schedule found for resource', resource)
      return table
    }

    var scheduleRanges = defaultSchedule.toDateRangeSet(start, end)


    let alteaDb = new AlteaDb(this.objectSvc)

    let planningTypes = [...AlteaPlanningQueries.extraTypes(), ...AlteaPlanningQueries.staffTypes()]

    var plannings = await alteaDb.getPlanningsByTypes([resource.id, resource.branchId], start, end, planningTypes, resource.branchId)


    var staffPlannings = plannings.filterByResource(resource.id)
    var branchPlannings = plannings.filterByResource(resource.id)


    var absencePlannings = staffPlannings.filterByType(...AlteaPlanningQueries.absenceTypes())
    var availablePlannings = staffPlannings.filterByType(...AlteaPlanningQueries.availableTypes())

    /*
        var specialPlannings = plannings.filterByType(PlanningType.edu)
    */



    console.error(scheduleRanges)


    header.push('Dag', 'Initieel', 'Aangepast', '#uren', 'Batch in/out', '', 'Afwezigheden', 'Extra')

    let loopDayEnd = dateFns.addDays(start, 1)

    let totalLess = 0
    let daysLess = 0, daysWorking = 0

    let totalTooLate = new TimeSpan()
    let daysTooLate = 0
    /*
        let totalTooLate = 0
    let daysTooLate = 0, daysWorking = 0
    */
    for (let loopDay = start; loopDay < end; loopDay = loopDayEnd) {

      loopDayEnd = dateFns.addDays(loopDay, 1)
      let cols: string[] = []
      table.addRow(cols)

      console.error(loopDay)

      let day = dateFns.format(loopDay, 'dd/MM')

      let daySchedule = scheduleRanges.getRangesForDay(loopDay)




      cols.push(day)


      if (ArrayHelper.NotEmpty(daySchedule)) {
        let scheduleString = ''


        for (let range of daySchedule) {
          scheduleString += `${range.toString()}<br>`

          //   hoursWorked += range.duration.hours()

        }
        cols.push(scheduleString)




      } else {
        cols.push('')
        //cols.push('')
      }






      // Presence column (related to batching in/out)

      let staffPlanningsForDay = staffPlannings.filterByDateRangeType(loopDay, loopDayEnd, PlanningType.pres)

      let presenceRange : DateRange = null, presence = 0, actualStart: Date = null
      if (staffPlanningsForDay.notEmpty()) {
        presenceRange = staffPlanningsForDay.toDateRangeSet().firstRange()
        actualStart = presenceRange.from
        presence = presenceRange.duration.hours() - 0.5
      }

      // Calculate actual working hours (based on schedule)

      let dayScheduleSet = new DateRangeSet(daySchedule)

      let dayAbsencePlannings = absencePlannings.filterByDateRange(loopDay, loopDayEnd)
      let dayAbsence = dayAbsencePlannings.toDateRangeSet()

      let dayExtraPlannings = availablePlannings.filterByDateRange(loopDay, loopDayEnd)
     // let dayExtra = dayExtraPlannings.toDateRangeSet()

      if (dayScheduleSet.notEmpty())
        console.error('dayScheduleSet', dayScheduleSet)

      let dayActual = dayScheduleSet

      for (let dayExtraPlanning of dayExtraPlannings.plannings) {

        if (dayExtraPlanning.ors) {
          dayActual = dayExtraPlanning.toDateRangeSet()
        } else
          dayActual = dayActual.union(dayExtraPlanning.toDateRangeSet())
      }

      //dayActual = dayActual.union(dayExtra)


      dayActual = dayActual.subtract(dayAbsence)
      

      let expectedStart = dayActual.lowestDate()

      let expectedWorking = 0

      if (dayActual.notEmpty()) {

        expectedWorking = dayActual.duration.hours()

        if (dayActual.count == 1) {
          cols.push(dayActual.firstRange().toString())
        } else {
          cols.push(dayActual.toString())
        }

        if (expectedWorking >= 5)
          expectedWorking -= 0.5

        let deviates = this.deviatesMoreThanXPercent(expectedWorking, presence, 0.05)

        let fontColor = deviates ? 'red' : 'green'

        cols.push(`<b style="color: ${fontColor}">${_.round(expectedWorking, 2)}</b>`)


      } else {
        cols.push('')
        cols.push('')
      }

      let tooLate = false

      if (actualStart && expectedStart && actualStart > expectedStart) {
        tooLate = true
        daysTooLate++
        totalTooLate.seconds += dateFns.differenceInSeconds(actualStart, expectedStart)
        tooLate = true
      }


      if (presenceRange) {

        let fontColor = (presence < expectedWorking) ? 'red' : 'green'

        if (presence < expectedWorking) {
          totalLess += (presence - expectedWorking)
          daysLess++
        }

        daysWorking++

        cols.push(presenceRange.toHtml('HH:mm', `color: ${tooLate ? 'red' : 'green'}`))
        cols.push(`<b style="color: ${fontColor}">${_.round(presence, 2)}</b>`)
      } else {
        cols.push('')
        cols.push('')
      }


      cols.push(`${dayAbsencePlannings.toString()}`)
      cols.push(`${dayExtraPlannings.toString()}`)




      /*
      let staffPlanningsForDay = staffPlannings.getRangesForDay(loopDay)

      let branchPlanningsForDay = branchPlannings.getRangesForDay(loopDay)
*/



      // ranges.find(range => dateFns.isSameDay(loopDay, range.start) || dateFns.isSameDay(loopDay, range.end))

      //console.error(range)

    }

    totalLess = _.round(totalLess, 2)

    let pctDaysTooLate = _.round((daysLess / daysWorking) * 100, 2)

    table.addRow(['Totaal te weinig:', `${totalLess}`])
    table.addRow(['Dagen te weinig:', `${daysLess} (${pctDaysTooLate}%)`])


    table.addRow(['Totaal te laat:', `${totalTooLate.toString()}`])
    table.addRow(['Dagen te laat:', `${daysTooLate} (${pctDaysTooLate}%)`])


    return table

    /*
    let month = dateFns.startOfMonth(start)
    let end = dateFns.endOfMonth(start)

    let plannings = await alteaDb.getPlanningsByTypes(resourceId, month, end, [PlanningType.hol, PlanningType.holReq])
*/

  }






}
