import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Product, ProductType, ProductTypeIcons, ResourceTypeIcons, Resource, ResourceType, Contact } from 'ts-altea-model'
import { ApiListResult, DbQuery, QueryOperator, Translation, ApiResult, ApiStatus, ObjectWithId } from 'ts-common'
import { ContactService, ProductService, ResourceService } from 'ng-altea-common'
import { Observable, take, takeUntil } from 'rxjs';
import { NgBaseComponent, DashboardService, TranslationService, BackendHttpServiceBase, NgBaseListComponent } from 'ng-common'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner"
import * as _ from "lodash";


import { tr } from 'date-fns/locale';
import { NewContactComponent } from '../new-contact/new-contact.component';


@Component({
  selector: 'ngx-altea-contact-list',
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.scss'],
})
export class ContactListComponent extends NgBaseListComponent<Contact> implements OnInit, OnDestroy {

  @ViewChild('newModal') public newModal: NewContactComponent;

  ResourceTypeIcons = ResourceTypeIcons

  searchFor = ''
  currentId?: string

  resourceType: ResourceType

  constructor(objectSvc: ContactService, private translationSvc: TranslationService,
    dashboardSvc: DashboardService,
    private modalService: NgbModal, protected route: ActivatedRoute, router: Router, spinner: NgxSpinnerService) {
    super(['name', 'color'], { searchEnabled: true, addEnabled: true, path: 'contacts' }
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

    query.take = 100
    query.orderBy('name')

    return query

  }

  override getSearchDbQuery(searchFor: string): DbQuery | null {
    const query = new DbQuery()

    query.and('name', QueryOperator.contains, searchFor)
    query.and('del', QueryOperator.equals, false)

    return query
  }

  override addNew() {
    console.log('Add product')
    // this.newModal.show(this.resourceType)
  }

  // select(object: Resource) {

  //   const mobileMod = this.dashboardSvc.isMobile ? 'mobile/' : ''

  //   if (object?.id)
  //     this.router.navigate(['/aqua/contacts/' + mobileMod, object.id])
  //   else
  //     this.router.navigate(['/aqua/contacts/' + mobileMod])
  // }
  /*

<i class="fa-brands fa-facebook"></i>
<i class="fa-brands fa-google"></i>
  */

}

