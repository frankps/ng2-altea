import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Product, ProductType, ProductTypeIcons, ResourceTypeIcons, Resource, ResourceType, Contact, Gift, LoyaltyProgram } from 'ts-altea-model'
import { ApiListResult, DbQuery, QueryOperator, Translation, ApiResult, ApiStatus, ObjectWithId, SortOrder } from 'ts-common'
import { ContactService, GiftService, ProductService, ResourceService, SessionService } from 'ng-altea-common'
import { Observable, take, takeUntil } from 'rxjs';
import { NgBaseComponent, DashboardService, TranslationService, BackendHttpServiceBase, NgBaseListComponent } from 'ng-common'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner"
import * as _ from "lodash";

import { tr } from 'date-fns/locale';
import { LoyaltyProgramService } from 'projects/ng-altea-common/src/lib/data-services/sql/loyalty-program.service';

@Component({
  selector: 'ngx-altea-loyalty-program-list',
  templateUrl: './loyalty-program-list.component.html',
  styleUrls: ['./loyalty-program-list.component.scss']
})
export class LoyaltyProgramListComponent extends NgBaseListComponent<LoyaltyProgram> implements OnInit, OnDestroy {
  //@ViewChild('newModal') public newModal: NewContactComponent;

  ResourceTypeIcons = ResourceTypeIcons

  searchFor = ''
  currentId?: string

  resourceType: ResourceType

  constructor(objectSvc: LoyaltyProgramService, private translationSvc: TranslationService,
    dashboardSvc: DashboardService, protected sessionSvc: SessionService,
    private modalService: NgbModal, protected route: ActivatedRoute, router: Router, spinner: NgxSpinnerService) {
    super(['name'], { searchEnabled: true, addEnabled: true, path: 'loyalty' }
      , objectSvc, dashboardSvc, spinner, router)
  }

  override ngOnDestroy() {
    super.ngOnDestroy()   // important: close all open subscriptions
  }

  ngOnInit() {
    super._ngOnInit()

    this.getListObjects()
  }

  override getInitDbQuery(): DbQuery | null {

    const query = new DbQuery()
    query.and('del', QueryOperator.equals, false)
    query.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)

    query.take = 20
    query.orderBy('idx', SortOrder.asc)

    return query

  }

  override getSearchDbQuery(searchFor: string): DbQuery | null {


    if (!searchFor)
      return null

    searchFor = searchFor.trim()

    const query = new DbQuery()
    
    if (searchFor.length == 36) {
      query.or('id', QueryOperator.equals, searchFor)
    } else {
      query.or('name', QueryOperator.contains, searchFor)
    }
    
    /*
    query.or('fromName', QueryOperator.contains, searchFor)

    query.and('del', QueryOperator.equals, false)
*/
    return query

  }

  override addNew() {
    console.log('Add product')
  }

}
