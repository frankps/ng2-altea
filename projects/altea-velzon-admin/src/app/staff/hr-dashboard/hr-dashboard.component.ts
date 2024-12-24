import { Component, OnInit } from '@angular/core';
import { OrderService, ResourcePlanningService, SessionService } from 'ng-altea-common';
import { AppComponent } from '../../app.component';
import { TranslationService } from 'ng-common'
import { ResourcePlanning, PlanningType, Resource, ResourceRequest } from 'ts-altea-model';
import { ArrayHelper, DateHelper, DbQuery, QueryOperator } from 'ts-common';
import * as dateFns from 'date-fns'
import * as _ from "lodash";

@Component({
  selector: 'app-hr-dashboard',
  templateUrl: './hr-dashboard.component.html',
  styleUrls: ['./hr-dashboard.component.scss']
})
export class HrDashboardComponent implements OnInit {

  holidays: ResourcePlanning[] = []
  holidayRequests: ResourcePlanning[] = []

  init = false

  constructor(protected sessionSvc: SessionService, protected appComponent: AppComponent, protected translationSvc: TranslationService, protected planningSvc: ResourcePlanningService, protected orderSvc: OrderService) {

  }


  async ngOnInit() {

    await this.getHolidays()

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




}
