import { Component, Input, OnInit } from '@angular/core';
import { OrderService, ResourcePlanningService, ResourceService, SessionService } from 'ng-altea-common';
import { DashboardService, ToastType } from 'ng-common';
import { Resource, ResourcePlanning, ResourceSet } from 'ts-altea-model';
import { ApiStatus, ArrayHelper, CollectionChangeTracker } from 'ts-common';
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"


@Component({
  selector: 'order-mgr-debug-plannings',
  templateUrl: './debug-plannings.component.html',
  styleUrls: ['./debug-plannings.component.css']
})
export class DebugPlanningsComponent implements OnInit {

  edit: boolean = false

  _plannings: ResourcePlanning[]
  planningChanges: CollectionChangeTracker<ResourcePlanning>

  @Input() set plannings(value: ResourcePlanning[]) {
    this._plannings = value
    this.planningChanges = new CollectionChangeTracker<ResourcePlanning>(this.plannings, ResourcePlanning, {
      propsToUpdate: ['resourceId', 'start', 'end']
    })
  }

  get plannings(): ResourcePlanning[] {
    return this._plannings
  }


  resources: Resource[]

  resourceGroups: Resource[]

  constructor(protected resPlanSvc: ResourcePlanningService, protected resSvc: ResourceService, protected sessionSvc: SessionService,
    protected orderSvc: OrderService, protected dashboardSvc: DashboardService, protected spinner: NgxSpinnerService
  ) {

  }

  debugPlanning(plan: ResourcePlanning) {
    console.log(plan)
  }


  async ngOnInit() {

    let branch = await this.sessionSvc.branch$()

    let resources = await this.resSvc.getAllForBranch$()
    this.resources = _.sortBy(resources, 'name')

    this.resourceGroups = this.resources.filter(r => r.isGroup)
    this.resources = this.resources.filter(r => !r.isGroup)

    console.warn(this.resources)
  }

  changeStartHour(plan: ResourcePlanning, event) {

    let startHour = event.srcElement.value
    console.log(startHour)

    plan.changeStartHour(startHour)

    this.planningChanges.update(plan)

  }


  changeEndHour(plan: ResourcePlanning, event) {

    let endHour = event.srcElement.value
    console.log(endHour)

    plan.changeEndHour(endHour)

    this.planningChanges.update(plan)

  }

  resourceChanged(plan: ResourcePlanning, property: string, newResource: Resource) {

    //console.log(event)
    if (property == 'resourceId')
      plan.resource = newResource
    else
      plan.resourceGroup = newResource

    this.planningChanges.update(plan)
    plan.markAsUpdated(property)
  }

  async savePlannings() {

    let error

    try {
      this.spinner.show()


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

        this.edit = false

      } else {

        if (res.message)
          error = res.message
        else
          error = 'There was a problem!'
        // this.dashboardSvc.showToastType(ToastType.saveError)

      }



    } catch (err) {

      console.error(err)
      error = 'Problem updating WhatsApp template!'

    } finally {

      this.spinner.hide()

      if (error)
        this.dashboardSvc.showErrorToast(error)
      else
        this.dashboardSvc.showSuccessToast('Bewaard')

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
