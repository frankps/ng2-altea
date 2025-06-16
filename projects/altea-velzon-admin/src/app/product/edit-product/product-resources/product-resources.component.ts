import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { ProductService, PriceService, ResourceService, AlteaService, SessionService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, Resource, DurationMode, DurationReference, Schedule } from 'ts-altea-model'
import { FormCardSectionEventData, TranslationService } from 'ng-common'
import { ActivatedRoute, Router } from '@angular/router';
import { NgxModalComponent } from 'ng-common';
import { ListSectionMode, BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, Translation, ObjectHelper, DbQuery, QueryOperator, CollectionChangeTracker, ObjectWithId } from 'ts-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { ManageProductService } from '../../manage-product.service';
import { EditProductComponent } from '../edit-product.component';
import { Observable } from 'rxjs';




@Component({
  selector: 'ngx-altea-product-resources',
  templateUrl: './product-resources.component.html',
  styleUrls: ['./product-resources.component.scss'],
})
export class ProductResourcesComponent implements OnInit {

  ListSectionMode = ListSectionMode

  thisSection = 'resources'
  //  propsToUpdate = ['offset', 'duration']

  dirty = false
  enableSave = true

  mode = ListSectionMode.readOnly

  @Input() parent: EditProductComponent
  //  @Input() editSection: string
  @Input() product: Product

  @Input() collection: any[]

  objNew = new ProductResource()
  objEdit?: ProductResource
  idxEdit = -1

  resources = []
  resources$: Observable<ApiListResult<Resource>>

  durationMode: Translation[] = []
  durationReference: Translation[] = []

  branchSchedules: Schedule[]

  constructor(private resourceSvc: ResourceService, private translationSvc: TranslationService, private alteaSvc: AlteaService, private sessionSvc: SessionService) {

    this.resources$ = this.resourceSvc.getMany()

    this.resources$.subscribe(res => {
      this.resources = res.data
    })

    this.translationSvc.translateEnum(DurationMode, 'enums.duration-mode.', this.durationMode, false, true)
    this.translationSvc.translateEnum(DurationReference, 'enums.duration-reference.', this.durationReference, false, true)


  }

  async ngOnInit() {

    this.branchSchedules = await this.alteaSvc.db.branchSchedules()

    console.error(this.branchSchedules)
  }

  moveUp(obj: ProductResource, idx: number) {

    console.error(this.collection)

    let prev = this.collection[idx - 1]

    let currentIdx = obj.idx
    obj.idx = prev.idx

    prev.idx = currentIdx


    this.collection = _.sortBy(this.collection, 'idx')

    this.parent.resourceChanges?.updateId(obj.id)
    this.parent.resourceChanges?.updateId(prev.id)

    this.dirty = true

    console.error(obj)

  }


  getScheduleName(scheduleId: string) {
    if (!Array.isArray(this.branchSchedules) || this.branchSchedules.length == 0)
      return "not available"

    const schedule = this.branchSchedules.find(schedule => schedule.id == scheduleId)

    if (schedule)
      return schedule.name
    else
      return "not found"

  }


  sectionInEdit() {
    return this.parent.editSectionId === this.thisSection
  }


  getNextIdx(collection: any[]): number {

    if (!collection || collection.length == 0)
      return 0


    const maxObj = _.maxBy(collection, 'idx')

    if (!maxObj)
      return 0

    return 100 + maxObj.idx
  }

  startAdd() {

    this.objNew = new ProductResource()

    this.objNew.productId = this.product.id   //product = new ConnectTo(this.product.id)

    this.objNew.idx = this.getNextIdx(this.collection)

    console.warn(this.objNew)

    this.mode = ListSectionMode.createNew
  }

  cancelAdd() {
    this.mode = ListSectionMode.readOnly
  }

  addToList() {

    console.error('addToList')
    //  this.parent.resourceChanges.

    // attach the resource object to the new object
    const resource = this.resources.find(r => r.id === this.objNew.resourceId)
    this.objNew.resource = resource

    this.collection.push(this.objNew)

    this.parent.resourceChanges.createId(this.objNew.id)

    this.objNew = new ProductResource()

    this.dirty = true
    this.mode = ListSectionMode.readOnly
  }

  delete(obj) {

    if (!obj)
      return

    this.parent.resourceChanges.deleteId(obj.id)
    this.dirty = true

  }

  startEdit(obj, idx) {
    if (!obj)
      return

    this.mode = ListSectionMode.edit
    this.idxEdit = idx
    this.enableSave = false
    console.error(obj)

    this.objEdit = ObjectHelper.clone(obj, ProductResource)
  }

  cancelItemEdit() {

    this.idxEdit = -1
    this.enableSave = true

    this.mode = ListSectionMode.readOnly
  }

  acceptItemEdit(obj, idx) {

    this.product.resources[this.idxEdit] = this.objEdit
    this.idxEdit = -1
    this.enableSave = true
    this.dirty = true
    this.mode = ListSectionMode.readOnly

    console.warn(obj)


    this.parent.resourceChanges?.updateId(obj.id)

  }

  demo() {
    //this.product.resources
    console.log(this.objNew.resourceId)
  }


  editModeChanged(cardSectionChanged: FormCardSectionEventData) {

    switch (cardSectionChanged.sectionId) {
      case this.thisSection:

        this.idxEdit = -1
        this.enableSave = true
        break
    }


    this.parent.editModeChanged(cardSectionChanged)

  }

}
