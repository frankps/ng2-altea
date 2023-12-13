import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { ProductService, PriceService, ResourceService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, Resource, DurationMode, DurationReference, ProductRule, ProductRuleType, Schedule } from 'ts-altea-model'
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
  selector: 'ngx-altea-product-rules',
  templateUrl: './product-rules.component.html',
  styleUrls: ['./product-rules.component.scss'],
})
export class ProductRulesComponent {

  ListSectionMode = ListSectionMode

  thisSection = 'rules'

  dirty = true
  enableSave = true

  mode = ListSectionMode.readOnly

  @Input() parent: EditProductComponent
  @Input() product: Product

  @Input() collection: any[]

  newRule = new ProductRule()


  ruleTypes: Translation[] = []
  schedules: Schedule[]


  //rule: ProductRule = new ProductRule
  constructor(private translationSvc: TranslationService, private scheduleSvc: ScheduleService, private sessionSvc: SessionService) {

    this.translationSvc.translateEnum(ProductRuleType, 'enums.product-rule-type.', this.ruleTypes)
  
    this.getSchedules$()
  }

  sectionInEdit(mode?: ListSectionMode) {

    if (!mode)
      return this.parent.editSectionId === this.thisSection
    else
      return this.parent.editSectionId === this.thisSection && this.mode === mode
  }


  startAdd() {

    console.error(this.ruleTypes)

    this.newRule = new ProductRule()
    // this.objNew.productId = this.product.id
    this.mode = ListSectionMode.createNew
  }

  addRule() {
    if (!this.product.rules)
      this.product.rules = []

    this.product.rules.push(this.newRule)

    this.newRule = new ProductRule()
  }

  async getSchedules$() {
    const qry = this.getSchedulesQry()
    this.schedules = await this.scheduleSvc.query$(qry)

    console.error(this.schedules)
  }

  getSchedulesQry(): DbQuery {

    const scheduleQry = new DbQuery()

    const branchId = this.sessionSvc.branchId!
    /* Every branch has a resource with the same id 
    */
    scheduleQry.and('branchId', QueryOperator.equals, branchId)
    scheduleQry.and('resourceId', QueryOperator.equals, branchId)
    scheduleQry.orderBy('idx')

    return scheduleQry

  }
}
