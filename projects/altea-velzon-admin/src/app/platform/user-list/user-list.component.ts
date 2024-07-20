import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Product, ProductType, ProductTypeIcons, ResourceTypeIcons, Resource, ResourceType, Contact, User, ProviderIcon } from 'ts-altea-model'
import { ApiListResult, DbQuery, QueryOperator, Translation, ApiResult, ApiStatus, ObjectWithId } from 'ts-common'
import { ContactService, ProductService, ResourceService, UserService } from 'ng-altea-common'
import { Observable, take, takeUntil } from 'rxjs';
import { NgBaseComponent, DashboardService, TranslationService, BackendHttpServiceBase, NgBaseListComponent } from 'ng-common'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner"
import * as _ from "lodash";

@Component({
  selector: 'ngx-altea-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent extends NgBaseListComponent<User> implements OnInit, OnDestroy {

  ProviderIcon =  ProviderIcon

  ResourceTypeIcons = ResourceTypeIcons

  searchFor = ''
  currentId?: string

  resourceType: ResourceType

  constructor(objectSvc: UserService, private translationSvc: TranslationService,
    dashboardSvc: DashboardService,
    private modalService: NgbModal, protected route: ActivatedRoute, router: Router, spinner: NgxSpinnerService) {
    super(['first', 'last', 'email'], { searchEnabled: true, addEnabled: false, path: 'users' }
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
//    query.and('del', QueryOperator.equals, false)
    query.and('email', QueryOperator.not, null)
    query.take = 100
    query.orderBy('email')

    return query

  }

  override getSearchDbQuery(searchFor: string): DbQuery | null {
    const query = new DbQuery()

    query.and('email', QueryOperator.contains, searchFor)
   // query.and('last', QueryOperator.contains, searchFor)

    return query
  }

}
