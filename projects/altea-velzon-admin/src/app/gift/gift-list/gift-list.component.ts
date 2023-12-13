import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Product, ProductType, ProductTypeIcons, ResourceTypeIcons, Resource, ResourceType, Contact, Gift } from 'ts-altea-model'
import { ApiListResult, DbQuery, QueryOperator, Translation, ApiResult, ApiStatus, ObjectWithId } from 'ts-common'
import { ContactService, GiftService, ProductService, ResourceService, SessionService } from 'ng-altea-common'
import { Observable, take, takeUntil } from 'rxjs';
import { NgBaseComponent, DashboardService, TranslationService, BackendHttpServiceBase, NgBaseListComponent } from 'ng-common'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner"
import * as _ from "lodash";

import { tr } from 'date-fns/locale';


@Component({
  selector: 'ngx-altea-gift-list',
  templateUrl: './gift-list.component.html',
  styleUrls: ['./gift-list.component.scss'],
})
export class GiftListComponent extends NgBaseListComponent<Gift> implements OnInit, OnDestroy {

  //@ViewChild('newModal') public newModal: NewContactComponent;

  ResourceTypeIcons = ResourceTypeIcons

  searchFor = ''
  currentId?: string

  resourceType: ResourceType

  constructor(objectSvc: GiftService, private translationSvc: TranslationService,
    dashboardSvc: DashboardService, protected sessionSvc: SessionService,
    private modalService: NgbModal, protected route: ActivatedRoute, router: Router, spinner: NgxSpinnerService) {
    super(['code'], { searchEnabled: true, addEnabled: true, path: 'gifts' }
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
    query.and('deleted', QueryOperator.equals, false)

    query.take = 20
    query.orderBy('code')

    return query

  }

  override getSearchDbQuery(searchFor: string): DbQuery | null {

    const query = new DbQuery()
    query.or('code', QueryOperator.contains, searchFor)
    query.or('fromName', QueryOperator.contains, searchFor)

    query.and('deleted', QueryOperator.equals, false)

    return query

  }

  override addNew() {
    console.log('Add product')
  }



}


