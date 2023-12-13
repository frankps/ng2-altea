import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Product, ProductType, ProductTypeIcons, ResourceTypeIcons, Resource, ResourceType, Contact, Gift, Subscription } from 'ts-altea-model'
import { ApiListResult, DbQuery, QueryOperator, Translation, ApiResult, ApiStatus, ObjectWithId, SortOrder } from 'ts-common'
import { ContactService, GiftService, ProductService, ResourceService, SessionService, SubscriptionService } from 'ng-altea-common'
import { Observable, take, takeUntil } from 'rxjs';
import { NgBaseComponent, DashboardService, TranslationService, BackendHttpServiceBase, NgBaseListComponent } from 'ng-common'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner"
import * as _ from "lodash";

@Component({
  selector: 'ngx-altea-subscription-list',
  templateUrl: './subscription-list.component.html',
  styleUrls: ['./subscription-list.component.scss'],
})
export class SubscriptionListComponent extends NgBaseListComponent<Subscription> implements OnInit, OnDestroy {

  //@ViewChild('newModal') public newModal: NewContactComponent;

  ResourceTypeIcons = ResourceTypeIcons

  searchFor = ''
  currentId?: string

  resourceType: ResourceType

  constructor(objectSvc: SubscriptionService, private translationSvc: TranslationService,
    dashboardSvc: DashboardService, protected sessionSvc: SessionService,
    private modalService: NgbModal, protected route: ActivatedRoute, router: Router, spinner: NgxSpinnerService) {
    super(['name'], { searchEnabled: true, addEnabled: true, path: 'subscriptions' }
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
    query.include('contact')

    query.take = 20
    query.orderBy('createdAt', SortOrder.desc)

    return query

  }

  override getSearchDbQuery(searchFor: string): DbQuery | null {

    const query = new DbQuery()
    query.or('name', QueryOperator.contains, searchFor)
    query.or('contact.name', QueryOperator.contains, searchFor)
    query.and('deleted', QueryOperator.equals, false)

    query.include('contact')
    return query

  }

  override addNew() {
    console.log('Add product')
  }



}



