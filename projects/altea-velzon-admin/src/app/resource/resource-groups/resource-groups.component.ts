import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { ProductService, PriceService, ResourceService, ResourceLinkService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, Resource, DurationMode, DurationReference, ResourceLink, ResourceType } from 'ts-altea-model'
import { FormCardSectionEventData, ToastType, TranslationService } from 'ng-common'
import { ActivatedRoute, Router } from '@angular/router';
import { NgxModalComponent } from 'ng-common';
import { ListSectionMode, BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, Translation, ObjectHelper, DbQuery, QueryOperator, CollectionChangeTracker, ObjectWithId, ApiStatus, ArrayHelper } from 'ts-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"

import { Observable } from 'rxjs';
import { EditResourceComponent } from '../edit-resource/edit-resource.component';



export enum ResourceGroupMode {
  none = "none",
  showGroups = "showGroups",
  showChildren = "showChildren"
}

@Component({
  selector: 'ngx-altea-resource-groups',
  templateUrl: './resource-groups.component.html',
  styleUrls: ['./resource-groups.component.scss'],
})
export class ResourceGroupsComponent {

  _groupMode = ResourceGroupMode.none

  @Input() set groupMode(value: ResourceGroupMode) // = ResourceGroupMode.none
  {
    if (value != this._groupMode) {
      this._groupMode = value

      if (this._groupMode == ResourceGroupMode.showGroups)
        this.getResources(true)
      else
        this.getResources(false)

      //  console.error(`>>> groupMode changed ${this._groupMode}`)
    }

  }

  get groupMode(): ResourceGroupMode {
    return this._groupMode
  }


  @Input() parent: EditResourceComponent
  @Input() resource: Resource

  _collection: any[]
  @Input() set collection(value: any[]) {

    console.error(`>>> new collection`)
    console.warn(value)

    this._collection = value

    this.changes = new CollectionChangeTracker<ResourceLink>(value, ResourceLink, {
      idProperties: ['groupId', 'childId'],
      propsToRemove: ['group', 'child', 'id']
    })

  }

  get collection(): any[] {
    return this._collection
  }

  changes: CollectionChangeTracker<ResourceLink>

  ListSectionMode = ListSectionMode
  mode = ListSectionMode.readOnly

  thisSection = 'groups'

  allResources: Resource[]
  resources: Resource[]
  objNew = new ResourceLink()

  /** Resource selected from drop-down in order to add */
  selectedResource: Resource


  constructor(protected resourceLinkSvc: ResourceLinkService, protected route: ActivatedRoute, protected router: Router, protected resourceSvc: ResourceService) {

  }

  async getResources(resourceGroups: boolean = false) {



    this.allResources = await this.resourceSvc.getAllForBranch$()

    var names = this.allResources.map(r => r.name)
    console.error(names)

    if (resourceGroups)
      this.resources = this.allResources.filter(r => r.isGroup)
    else
      this.resources = this.allResources.filter(r => !r.isGroup)



  }


  get linkProperty() {
    if (this.groupMode == ResourceGroupMode.showGroups)
      return "group"
    else
      return "child"
  }


  startAdd() {
    this.objNew = new ResourceLink()

    this.mode = ListSectionMode.createNew
  }


  addResource() {

    if (this.groupMode == ResourceGroupMode.showGroups) {
      this.objNew.groupId = this.selectedResource.id
      this.objNew.group = this.selectedResource
      this.objNew.childId = this.resource.id
      //this.objNew.resource = this.resource
    } else {
      this.objNew.groupId = this.resource.id
      //this.objNew.group = this.resource
      this.objNew.childId = this.selectedResource.id
      this.objNew.child = this.selectedResource
    }

    //this.collection.push(this.objNew)
    this.changes.add(this.objNew) //createId(this.objNew.id)

    console.error(this.changes)

    this.mode = ListSectionMode.readOnly
  }

  cancelAdd() {
    this.mode = ListSectionMode.readOnly
  }


  delete(obj: any) {

    this.changes.deleteId(obj.id)

  }

  cancel() {
    this.changes.cancel()
    this.parent.cancel()
  }


  impactedResourceIds(batch: ApiBatchProcess<ResourceLink>): string[] {

    if (!batch.hasChanges())
      return []

    let resourceIds = []


    if (ArrayHelper.NotEmpty(batch.create)) {
      for (let resourceLink of batch.create)
        resourceIds.push(resourceLink.childId, resourceLink.groupId)
    }

    if (ArrayHelper.NotEmpty(batch.update)) {
      for (let obj of batch.update) {
        let resourceLink = obj as ResourceLink
        resourceIds.push(resourceLink.childId, resourceLink.groupId)
      }
    }

    if (ArrayHelper.NotEmpty(batch.delete)) {
      for (let obj of batch.delete) {
        let resourceLink = obj as ResourceLink
        resourceIds.push(resourceLink.childId, resourceLink.groupId)
      }
    }

    return resourceIds

  }

  async save() {

    const batch = this.changes.getApiBatch()

    console.error(batch)

    if (!batch || !batch.hasChanges()) {
      this.parent.editSectionId = ''
      this.mode = ListSectionMode.readOnly
      return
    }

    const res = await this.resourceLinkSvc.batchProcess$(batch)

    if (res.status == ApiStatus.error) {
      this.parent.dashboardSvc.showToastType(ToastType.saveError)
    } else {
      this.parent.dashboardSvc.showToastType(ToastType.saveSuccess)

      let resourceIds = this.impactedResourceIds(batch)

     // await this.resourceSvc.refreshCachedObjectFromBackend

      await this.resourceSvc.refreshCachedObjectsFromBackend(resourceIds)
      /*
        
      if (ArrayHelper.NotEmpty(batch.create)) {

        for (let resourceLink of batch.create) {
          await this.resourceSvc.refreshCachedObjectFromBackend(resourceLink.childId)
          await this.resourceSvc.refreshCachedObjectFromBackend(resourceLink.groupId)
        }
      }
        */




      this.changes.reset()
    }

    console.error(res)
    this.changes?.reset()
    this.parent.editSectionId = ''



  }

}
