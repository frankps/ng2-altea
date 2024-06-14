import { Injectable } from '@angular/core';
import { Product, Resource, Schedule } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../session.service';
import { DbQuery, QueryOperator } from 'ts-common';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService extends BackendHttpServiceBase<Schedule> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {

    super(Schedule, 'Schedule', sessionSvc.backend, sessionSvc.branchUnique + '/schedules', http)
  }

  async getForBranch$(branchId?: string): Promise<Schedule[]> {

    if (!branchId)
      branchId = this.sessionSvc.branchId

    if (!branchId)
      throw new Error(`No branchId available in session service`)

    const scheduleQry = new DbQuery()

    scheduleQry.and('branchId', QueryOperator.equals, branchId)
    scheduleQry.and('resourceId', QueryOperator.equals, branchId)
    scheduleQry.orderBy('idx')

    const schedules = await this.query$(scheduleQry)

    return schedules
  }

}

