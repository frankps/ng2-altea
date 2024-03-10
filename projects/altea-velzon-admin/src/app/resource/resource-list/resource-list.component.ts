import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Product, ProductType, ProductTypeIcons, ResourceTypeIcons, Resource, ResourceType } from 'ts-altea-model'
import { ApiListResult, DbQuery, QueryOperator, Translation, ApiResult, ApiStatus, ObjectWithId } from 'ts-common'
import { ProductService, ResourceService, SessionService } from 'ng-altea-common'
import { Observable, take, takeUntil } from 'rxjs';
import { NgBaseComponent, DashboardService, TranslationService, BackendHttpServiceBase, NgBaseListComponent } from 'ng-common'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner"
import * as _ from "lodash";
import { NewResourceComponent } from '../new-resource/new-resource.component';



@Component({
  selector: 'ngx-altea-resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
})
export class ResourceListComponent extends NgBaseListComponent<Resource> implements OnInit, OnDestroy {

  @ViewChild('newModal') public newModal: NewResourceComponent;

  ResourceTypeIcons = ResourceTypeIcons

  searchFor = ''
  currentId?: string

  resourceType: ResourceType

  constructor(objectSvc: ResourceService, private translationSvc: TranslationService,
    dashboardSvc: DashboardService,
    private modalService: NgbModal, protected route: ActivatedRoute, router: Router, spinner: NgxSpinnerService, protected sessionSvc: SessionService) {
    super(['name', 'color'], { searchEnabled: true, addEnabled: true, path: 'resources' }
      , objectSvc, dashboardSvc, spinner, router)
  }

  override ngOnDestroy() {
    super.ngOnDestroy()   // important: close all open subscriptions
  }

  ngOnInit() {
    super._ngOnInit()

    this.route.params.pipe(takeUntil(this.ngUnsubscribe)).subscribe(params => {

      console.error(params)

      const resourceType = params['type']

      if (resourceType != 'any') {
        this.resourceType = resourceType
        this.config.pathIdPrefix = resourceType

        this.getListObjects()
      }

    })
  }

  getIcon(resource: Resource): string {
    if (!resource)
      return ''

    if (resource.isGroup)
      return ResourceTypeIcons.group
    else
      return ResourceTypeIcons[resource.type]
  }


  override getInitDbQuery(): DbQuery | null {

    const query = new DbQuery()
    query.and('deleted', QueryOperator.equals, false)
    query.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)

    if (this.resourceType)
      query.and('type', QueryOperator.equals, this.resourceType)

    query.take = 100
    query.orderBy('isGroup')
    query.orderBy('name')

    console.warn(query)

    return query
  }

  override getSearchDbQuery(searchFor: string): DbQuery | null {

    const query = new DbQuery()
    query.and('name', QueryOperator.contains, searchFor)
    query.and('deleted', QueryOperator.equals, false)
    query.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)

    if (this.resourceType)
      query.and('type', QueryOperator.equals, this.resourceType)

    return query

  }


  override addNew() {
    console.log('Add product')
    this.newModal.show(this.resourceType)
  }



  // select(object: Resource) {

  //   const mobileMod = this.dashboardSvc.isMobile ? 'mobile/' : ''

  //   if (object?.id)
  //     this.router.navigate(['/aqua/resources/' + mobileMod + this.resourceType, object.id])
  //   else
  //     this.router.navigate(['/aqua/resources/' + mobileMod + this.resourceType])
  // }

}
