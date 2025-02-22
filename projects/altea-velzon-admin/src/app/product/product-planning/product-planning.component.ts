import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { ProductService, PriceService, ResourceService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, Resource, DurationMode, DurationReference, ProductRule, ProductRuleType, Schedule, PlanningMode, PlanningBlockSeries, Branch, ResourceType, DateRange, DateRangeSet, ResourcePlanning, ResourcePlannings, PlanningType } from 'ts-altea-model'
import { FormCardSectionEventData, TranslationService } from 'ng-common'
import { ActivatedRoute, Router } from '@angular/router';
import { NgxModalComponent } from 'ng-common';
import { ListSectionMode, BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, Translation, ObjectHelper, DbQuery, QueryOperator, CollectionChangeTracker, ObjectWithId, ArrayHelper } from 'ts-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { Observable } from 'rxjs';
import { EditProductComponent } from '../edit-product/edit-product.component';
import { ScheduleService, SessionService, ResourcePlanningService } from 'ng-altea-common';

@Component({
  selector: 'ngx-altea-product-planning',
  templateUrl: './product-planning.component.html',
  styleUrls: ['./product-planning.component.scss'],
})
export class ProductPlanningComponent implements OnInit {

  thisSection = 'planning'

  @Input() parent: EditProductComponent
  @Input() product: Product

  PlanningMode = PlanningMode

  newBlock = new PlanningBlockSeries()

  schedules

  constructor(private scheduleSvc: ScheduleService, private sessionSvc: SessionService, private planningSvc: ResourcePlanningService) {


  }

  async ngOnInit() {

    this.schedules = await this.scheduleSvc.getForBranch$(this.sessionSvc.branchId)
  }



  addBlockSeries(newBlockSeries: PlanningBlockSeries) {
    if (!Array.isArray(this.product.plan))
      this.product.plan = []

    this.product.plan.push(newBlockSeries)


    this.newBlock = new PlanningBlockSeries()

  }


  deleteBlockSeries(idx: number) {

    if (!Array.isArray(this.product.plan))
      return


    this.product.plan.splice(idx, 1)

  }


  getScheduleName(scheduleId: string) {
    if (!Array.isArray(this.schedules) || this.schedules.length == 0)
      return "not available"

    const schedule = this.schedules.find(schedule => schedule.id == scheduleId)

    if (schedule)
      return schedule.name
    else
      return "not found"

  }


  async doPlanPrepTimes() {

    let from = new Date(2025, 2, 31)
    let to = new Date(2025, 3, 1)
    let scheduleId = 'd507d664-3d8f-4ebe-bb3b-86dcd7df6fc8'
    let prodResId = '7b9d4162-ee61-42f2-84f8-a474b3a92d4d'
    let branchId = this.sessionSvc.branchId

    let res = await this.planPrepTimes(branchId, ResourceType.human, this.product, from, to, scheduleId, prodResId)

    console.warn('res', res)

  }

  /**
   * Was introduced for pre-configuring cleaning blocks
   * 
   * @param branchId 
   * @param resType 
   * @param product 
   * @param from 
   * @param to 
   * @param scheduleId 
   * @param prodResId 
   * @returns 
   */
  async planPrepTimes(branchId: string, resType: ResourceType, product: Product, from: Date, to: Date, scheduleId: string, prodResId: string): Promise<ResourcePlannings> {

    // let prodRes = product.resources.filter(prodRes => prodRes.act && prodRes.prep && prodRes.resource?.type == resType && prodRes.scheduleIds.includes(scheduleId))

    let productResources = product.resources.filter(prodRes => prodRes.id == prodResId)

    let blockSeries = product.getBlockSeries(scheduleId)

    console.warn('prodRes', productResources)

    console.warn('blockSeries', blockSeries)

    if (ArrayHelper.IsEmpty(blockSeries))
      return new ResourcePlannings()

    let planningRange = new DateRange(from, to)


    // let allPrepTimeRanges = new DateRangeSet()

    let resourcePlannings = new ResourcePlannings()


    for (let blockSerie of blockSeries) {

      let dateRangeSet = blockSerie.makeBlocks(planningRange)

      for (let productResource of productResources) {

        // console.warn('productResource', productResource)

        let appliedRanges = productResource.applyToDateRangeSet(dateRangeSet)
        //   allPrepTimeRanges = allPrepTimeRanges.add(appliedRanges)

        for (let dateRange of appliedRanges.ranges) {

          let resourcePlanning = new ResourcePlanning()

          resourcePlanning.branchId = this.sessionSvc.branchId

          resourcePlanning.resourceGroupId = productResource.resourceId
          resourcePlanning.startDate = dateRange.from
          resourcePlanning.endDate = dateRange.to
          resourcePlanning.prep = true
          resourcePlanning.type = PlanningType.mask
          resourcePlanning.prep = productResource.prep
          resourcePlanning.overlap = productResource.prepOverlap

          resourcePlannings.plannings.push(resourcePlanning)

          //resourcePlanning.planningMode = PlanningMode.prepTime

        }

        // console.warn('allPrepTimeRanges', allPrepTimeRanges)
      }
    }


    console.warn('resourcePlannings', resourcePlannings)

    if (!resourcePlannings || resourcePlannings.isEmpty())
      return resourcePlannings

    let apiBatchProcess = new ApiBatchProcess<ResourcePlanning>()
    apiBatchProcess.create = resourcePlannings.plannings

    let res = await this.planningSvc.batchProcess$(apiBatchProcess, this.sessionSvc.branchId)

    console.warn('res', res)

    return resourcePlannings

  }






} 
