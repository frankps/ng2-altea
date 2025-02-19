import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { ProductService, PriceService, ResourceService, ResourceLinkService, ResourcePlanningService, SessionService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, Resource, DurationMode, DurationReference, ResourceLink, ResourceType, PlanningType, ResourcePlanning } from 'ts-altea-model'
import { DashboardService, FormCardSectionEventData, ToastType, TranslationService } from 'ng-common'
import { ActivatedRoute, Router } from '@angular/router';
import { NgxModalComponent } from 'ng-common';
import { ListSectionMode, BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, Translation, ObjectHelper, DbQuery, QueryOperator, CollectionChangeTracker, ObjectWithId, ApiStatus, DateHelper } from 'ts-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import * as dateFns from 'date-fns'
import { Observable } from 'rxjs';
import { EditResourceComponent } from '../edit-resource/edit-resource.component';

@Component({
  selector: 'ngx-altea-resource-planning',
  templateUrl: './resource-planning.component.html',
  styleUrls: ['./resource-planning.component.scss'],
})
export class ResourcePlanningComponent implements OnInit {
  @Input() parent: EditResourceComponent

  /*
  enum PlanningType {
  res   // reserved
  leave // holidays 
  ill 
  edu
}*/

  thisSection = 'planning'
  objNew: ResourcePlanning = new ResourcePlanning()
  ListSectionMode = ListSectionMode

  types: PlanningType[] = [PlanningType.ill, PlanningType.edu]

  plannings: ResourcePlanning[] = []

  planningTypes: Translation[] = []


  mode = ListSectionMode.readOnly

  _resource: Resource

  start: Date | string  // = new Date()
  end: Date | string // = dateFns.addDays(new Date(), 3)

  planningChanges: CollectionChangeTracker<ResourcePlanning>


  @Input() set resource(value: Resource) {
    this._resource = value
    console.error(value)
    this.prepareNew()
    this.getPlanning(value)
  }
  get resource(): Resource {
    return this._resource
  }



  // set startDate(value: Date) {
  //   this.start = value
  //   console.warn(this.start)
  // }


  // get startDate() {
  //   return this.start
  // }

  // startChanged(newStart: Date) {
  //   console.log(newStart)
  //   this.start
  // }

  constructor(public planningSvc: ResourcePlanningService, protected translationSvc: TranslationService, protected sessionSvc: SessionService, protected dashboardSvc: DashboardService,
    protected resourceSvc: ResourceService) {


  }

  async ngOnInit() {

    let planningTypes: Translation[] = []

    await this.translationSvc.translateEnum(PlanningType, 'enums.planning-type.', planningTypes)

    this.planningTypes = planningTypes.filter(pt => pt.key != 'pres')


    console.error(this.planningTypes)
  }

  startChanged(start: Date) {


    let start0am = dateFns.startOfDay(start)

    
    let end0am = dateFns.startOfDay(this.end as Date)
    
    if (start0am > end0am)
      this.end = start
    

  }

  editModeChanged(cardSectionChanged: FormCardSectionEventData) {

    this.parent.editModeChanged(cardSectionChanged)

    console.warn(this.parent.editSectionId)

  }

  cancel() {
    this.parent.cancel()
  }

  async getPlanning(resource: Resource) {

    if (!resource) {
      this.plannings = []
    }

    let startDate = new Date()
    let startNum = DateHelper.yyyyMMdd000000(startDate)


    const query = new DbQuery()
    query.and('resourceId', QueryOperator.equals, resource.id)
    query.and('type', QueryOperator.in, ['occ', 'hol', 'bnk', 'ill', 'abs', 'edu', 'avl'])
    // query.and('type', QueryOperator.in, this.types)

    /** we're only interested in general plannings (=> not tied to specific orders) */
    query.and('orderId', QueryOperator.equals, null)
    query.and('end', QueryOperator.greaterThanOrEqual, startNum)
    query.take = 200
    query.orderByDesc('start')
    //query.select('id', 'catId', 'name', 'type')

    this.planningSvc.query(query).subscribe(res => {
      this.plannings = res.data

      this.planningChanges = new CollectionChangeTracker<ResourcePlanning>(this.plannings, ResourcePlanning)
      console.error(this.plannings)
    })

  }



  prepareNew() {
    this.objNew = new ResourcePlanning()

    this.objNew.branchId = this.sessionSvc.branchId
    this.objNew.resourceId = this._resource.id

    this.start = new Date()
    this.start.setHours(8, 0, 0, 0)
    this.end = dateFns.addDays(new Date(), 3)
    this.end.setHours(23, 0, 0, 0)

    this.mode = ListSectionMode.createNew
  }

  delete(planning: ResourcePlanning) {
    this.planningChanges.delete(planning)

  }

  async addPlanning() {

    let planning = this.objNew

    console.error('Add planning ... ')

    this.objNew.branchId = this.sessionSvc.branchId
    this.objNew.resourceId = this._resource.id

    if (this.start instanceof Date) {

      if (planning.fullDays)
        planning.start = DateHelper.yyyyMMdd000000(this.start)
      else
        this.objNew.startDate = this.start
    }


    if (this.end instanceof Date) {

      if (planning.fullDays)
        planning.end = DateHelper.yyyyMMddxxxxxx(this.end)
      else
        this.objNew.endDate = this.end

    }


    this.planningChanges.add(this.objNew)

    this.prepareNew()
    /*
    this.objNew.branchId = this.sessionSvc.branchId
    this.objNew.resourceId = this._resource.id
    this.objNew.startDate = this.start
    this.objNew.endDate = this.end

    const res : ApiResult<ResourcePlanning> = await this.planningSvc.create$(this.objNew)

    if (res.status == ApiStatus.ok) {
      this.plannings.push(this.objNew)

    }

    console.error(res)
    */
  }

  async savePlanningChanges() {
    const batch = this.planningChanges?.getApiBatch()

    const res = await this.planningSvc.batchProcess$(batch, this.dashboardSvc.resourceId)

    if (res.status == ApiStatus.ok) {

      this.dashboardSvc.showToastType(ToastType.saveSuccess)
      await this.resourceSvc.refreshCachedObjectFromBackend(this.resource.id)

    } else {

      this.dashboardSvc.showToastType(ToastType.saveError)

    }


  }



}
