import { Component, Input, OnInit } from '@angular/core';
import { OrderService, ResourcePlanningService, ResourceService, SessionService } from 'ng-altea-common';
import { DashboardService, ToastType } from 'ng-common';
import { Resource, ResourcePlanning, ResourceSet } from 'ts-altea-model';
import { ApiStatus, ArrayHelper, CollectionChangeTracker } from 'ts-common';
import * as _ from "lodash";

@Component({
  selector: 'order-mgr-debug-plannings',
  templateUrl: './debug-plannings.component.html',
  styleUrls: ['./debug-plannings.component.css']
})
export class DebugPlanningsComponent implements OnInit {

  _plannings: ResourcePlanning[]
  planningChanges: CollectionChangeTracker<ResourcePlanning>

  @Input() set plannings(value: ResourcePlanning[]) {
    this._plannings = value
    this.planningChanges = new CollectionChangeTracker<ResourcePlanning>(this.plannings, ResourcePlanning, {
      propsToUpdate: ['resourceId']
    })
  }

  get plannings(): ResourcePlanning[] {
    return this._plannings
  }


  resources: Resource[]

  constructor(protected resPlanSvc: ResourcePlanningService, protected resSvc: ResourceService, protected sessionSvc: SessionService,
    protected orderSvc: OrderService, protected dashboardSvc: DashboardService
  ) {

  }


  async ngOnInit() {

    let branch = await this.sessionSvc.branch$()

    let resources = await this.resSvc.getAllForBranch$()
    this.resources = _.sortBy(resources, 'name')

    console.warn(this.resources)
  }

  resourceChanged(plan: ResourcePlanning, property: string) {

    this.planningChanges.update(plan)

    plan.markAsUpdated(property)
  }

  async savePlannings() {

    const batch = this.planningChanges?.getApiBatch()

    if (!batch.hasChanges()) {
      console.log('No changes')
      return
    }


    const res = await this.resPlanSvc.batchProcess$(batch, this.dashboardSvc.resourceId)

    if (res.status == ApiStatus.ok) {

      let orderId = this.plannings?.[0]?.orderId

      if (orderId) {
        const pushRes = await this.orderSvc.pushOrderToFirebase(orderId)
        console.log('pushOrderToFirebase', pushRes)
      }


      this.dashboardSvc.showToastType(ToastType.saveSuccess)
      //await this.resPlanSvc.refreshCachedObjectFromBackend(this.resource.id)

    } else {

      this.dashboardSvc.showToastType(ToastType.saveError)

    }


  }

  async savePlanning(plan: ResourcePlanning) {

    console.log(plan)

    plan.markAsUpdated('resourceId')

    let upd = {
      id: plan.id,
      resourceId: plan.resourceId
    }

    var res = await this.resPlanSvc.update$(upd)

    console.log(res)

  }


  /*   resourceSet: ResourceSet = new ResourceSet()
  
    @Input() set resources(value: Resource[]) {
  
      console.warn(value)
  
      if (Array.isArray(value)) {
  
        this.resourceSet.clear()
        this.resourceSet.add(...value)
  
      }
    }
  
    get resources(): Resource[] {
      return this.resourceSet.resources
    } */



}
