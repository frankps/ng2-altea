import { AfterContentChecked, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { AvailabilityContext, AvailabilityDebugInfo, AvailabilityRequest, AvailabilityResponse, Order, PossibleSlots, ReservationOptionSet, ResourceAvailability, ResourceAvailability2, ResourcePlanning, ResourceRequest, Schedule, SlotInfo, Solution, SolutionSet } from 'ts-altea-model';
import * as _ from "lodash"
import { AlteaService, OrderService, ResourcePlanningService } from 'ng-altea-common';
import { DbQuery, QueryOperator } from 'ts-common';

@Component({
  selector: 'order-mgr-debug-availability',
  templateUrl: './debug-availability.component.html',
  styleUrls: ['./debug-availability.component.scss'],
})
export class DebugAvailabilityComponent implements OnInit {

  request: AvailabilityRequest
  debug: AvailabilityDebugInfo
  ctx: AvailabilityContext

  resourceRequests: ResourceRequest[]
  availability: ResourceAvailability2
  order: Order

  solutionSet: SolutionSet

  /** options are derived from solutions */
  optionSet: ReservationOptionSet

  /** resource plannings indexed by resourceId */
  plannings: _.Dictionary<ResourcePlanning[]>

  _response: AvailabilityResponse


  branchSchedules: Schedule[]


  @Input() set response(response: AvailabilityResponse) {
    this._response = response

    if (!response)
      return

    if (response.solutionSet)
      this.solutionSet = response.solutionSet
    //  response.debug.resourceRequest

    if (response.optionSet)
      this.optionSet = response.optionSet


    if (response.debug)
      this.debug = response.debug

    if (this.debug) {
      this.ctx = this.debug.ctx
      this.resourceRequests = this.debug.resourceRequests

      this.availability = this.debug.availability
    }

    if (this.ctx) {
      this.order = this.ctx.order

      this.plannings = this.ctx.resourcePlannings.groupByResource()

      this.request = this.ctx.request


    }

    if (this.order) {
      for (let line of this.order.lines) {
        let name = line.product.name
        line.product.resources
      }
    }

  }

  constructor(protected alteaSvc: AlteaService, protected planSvc: ResourcePlanningService, protected orderSvc: OrderService) {

  }
  /* 
    , AfterContentChecked
    , private changeDetector: ChangeDetectorRef
    ngAfterContentChecked(): void {
      this.changeDetector.detectChanges();
    } */

  async ngOnInit() {

    this.branchSchedules = await this.alteaSvc.db.branchSchedules()

    console.error(this.branchSchedules)
  }


  async deleteTestData() {

    const start = 20240201000000
    const end = 20240401000000



    const deleteOrderQuery = new DbQuery()

    deleteOrderQuery.and('start', QueryOperator.greaterThanOrEqual, start)
    deleteOrderQuery.and('start', QueryOperator.lessThan, end)

    // deleteOrderQuery.and('start', QueryOperator.equals, null)
    /* this will also delete related objects (as defined in prisma schema)
     */
    let orders = await this.orderSvc.deleteMany$(deleteOrderQuery)

    console.error(orders)


  }






  resourceHasplannings(resourceId: string): boolean {
    if (!this.plannings)
      return false

    const plannings = this.plannings[resourceId]
    return (plannings && Array.isArray(plannings))
  }

  planningsForResource(resourceId: string): ResourcePlanning[] {

    if (!this.plannings)
      return []

    const plannings = this.plannings[resourceId]
    if (plannings && Array.isArray(plannings))
      return plannings
    else
      return []


  }





  getScheduleName(scheduleId: string) {
    if (!Array.isArray(this.branchSchedules) || this.branchSchedules.length == 0)
      return "not available"

    const schedule = this.branchSchedules.find(schedule => schedule.id == scheduleId)

    if (schedule)
      return schedule.name
    else
      return "not found"

  }
}
