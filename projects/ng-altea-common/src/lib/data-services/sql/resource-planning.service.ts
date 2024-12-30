import { Injectable } from '@angular/core';
import { PlanningType, Product, ProductResource, ResourcePlanning, ResourcePlannings } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';
import { DateHelper, DbQuery, QueryOperator } from 'ts-common';
import * as dateFns from 'date-fns'

@Injectable({
  providedIn: 'root'
})
export class ResourcePlanningService extends BackendHttpServiceBase<ResourcePlanning> {

  /** keep track of check-in/out & breaks of staff: ResourcePlannings of type 'brk' and 'pres' */
  staffToday: ResourcePlannings = new ResourcePlannings()
  staffTodayFetchedAt?: Date

  /* if specified, then staffToday contains valid plannings for this date (date in format: yyyyMMddhhmmss) */
  startOfDay: number = -1

  constructor(http: HttpClient, protected sessionSvc: SessionService) {

    super(ResourcePlanning, 'ResourcePlanning', sessionSvc.backend, sessionSvc.branchUnique + '/resource-plannings', http)
  }


  async getAllStaffPlannings() : Promise<ResourcePlannings> {

    let me = this

    let startOfDay = dateFns.startOfDay(new Date())
    let startOfDayNum = DateHelper.yyyyMMddhhmmss(startOfDay)

    let lastFetchedMinutesAgo = Number.MAX_SAFE_INTEGER 

    if (this.staffTodayFetchedAt) {
      lastFetchedMinutesAgo = dateFns.differenceInMinutes(new Date(), this.staffTodayFetchedAt)
    } 
    
    if (startOfDayNum == me.startOfDay && lastFetchedMinutesAgo < 15) {

      console.log('staffToday from cache', lastFetchedMinutesAgo, me.staffToday)
      return me.staffToday
    }
      

    let endOfDay = dateFns.endOfDay(new Date())
    let endOfDayNum = DateHelper.yyyyMMddhhmmss(endOfDay)

    var qry = new DbQuery()

    qry.and("branchId", QueryOperator.equals, me.sessionSvc.branchId)
    qry.and("type", QueryOperator.in, ['brk', 'pres'])
    qry.and("act", QueryOperator.equals, true)

    qry.and("start", QueryOperator.greaterThanOrEqual, startOfDayNum)
    qry.and("start", QueryOperator.lessThanOrEqual, endOfDayNum)

    let plannings = await me.query$(qry)

    me.staffToday = new ResourcePlannings(plannings)
    console.log('staffToday from backend', plannings)
    me.startOfDay = startOfDayNum
    me.staffTodayFetchedAt = new Date()

    return me.staffToday
  } 


  async getStaffPlannings(resourceId: string) : Promise<ResourcePlannings> {

    let staffToday = await this.getAllStaffPlannings()

    return staffToday.filterByResource(resourceId)

  }


  async staffCheckedIn(resourceId: string) : Promise<boolean> {
    
    let me = this

    var staffToday = await me.getAllStaffPlannings()

    let resourcePresent = staffToday.filterByResourceType(resourceId, PlanningType.pres)

    return !resourcePresent.isEmpty()
  }




}