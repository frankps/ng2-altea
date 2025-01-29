import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Gender, OnlineMode, Product, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, Resource, DurationMode, DurationReference, Schedule } from 'ts-altea-model'
import { BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, Translation, ObjectHelper, DbQuery, QueryOperator, ObjectWithId } from 'ts-common'


@Component({
  selector: 'ngx-altea-edit-product-resource',
  templateUrl: './edit-product-resource.component.html',
  styleUrls: ['./edit-product-resource.component.scss'],
})
export class EditProductResourceComponent {

  @Input() isNew = false
  @Input() object: ProductResource
  @Input() product: Product
  @Input() resources: Resource[]
  @Input() branchSchedules: Schedule[]

  @Input() durationMode: Translation[] = []
  @Input() durationReference: Translation[] = []

  @Output() save: EventEmitter<ProductResource> = new EventEmitter();
  @Output() cancel: EventEmitter<any> = new EventEmitter();

  css_cls_row= 'mt-3'
  
  constructor() {

  }

  _save() {
    this.save.emit(this.object)
  }

  _cancel() {
    console.log(this.product)
    this.cancel.emit()
  }


  resourceChanged(event: Resource) {
    console.error('resourceChanged')
    console.warn(event)

    this.object.resource = event

  }

}
