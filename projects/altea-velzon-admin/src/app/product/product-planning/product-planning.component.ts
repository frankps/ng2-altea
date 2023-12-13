import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { ProductService, PriceService, ResourceService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, Resource, DurationMode, DurationReference, ProductRule, ProductRuleType, Schedule, PlanningMode, PlanningBlockSeries } from 'ts-altea-model'
import { FormCardSectionEventData, TranslationService } from 'ng-common'
import { ActivatedRoute, Router } from '@angular/router';
import { NgxModalComponent } from 'ng-common';
import { ListSectionMode, BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, Translation, ObjectHelper, DbQuery, QueryOperator, CollectionChangeTracker, ObjectWithId } from 'ts-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { Observable } from 'rxjs';
import { EditProductComponent } from '../edit-product/edit-product.component';
import { ScheduleService, SessionService } from 'ng-altea-common';

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

  constructor(private scheduleSvc: ScheduleService, private sessionSvc: SessionService) {


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


    this.product.plan.splice(idx)

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


}
