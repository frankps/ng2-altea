import { Component, ViewChild, OnInit, Input } from '@angular/core';
import { ProductService, PriceService, ProductResourceService, ProductOptionService, SessionService, ProductOptionValueService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, ProductType, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, ProductOptionValue, FormulaTerm } from 'ts-altea-model'
import { DashboardService, FormCardSectionEventData, NgEditBaseComponent, ToastType, TranslationService } from 'ng-common'
import { ActivatedRoute, Router } from '@angular/router';
import { NgxModalComponent, DeleteModalComponent } from 'ng-common';
import { BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, Translation, ObjectHelper, CollectionChangeTracker, ObjectWithId, ApiStatus, ListSectionMode, ApiMultiResult } from 'ts-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { ManageProductService } from '../manage-product.service';
import { NgTemplateOutlet } from '@angular/common';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as sc from 'stringcase'
import { ConnectTo } from 'ts-common'
import { EditProductComponent } from '../edit-product/edit-product.component';

@Component({
  selector: 'ngx-altea-product-options',
  templateUrl: './product-options.component.html',
  styleUrls: ['./product-options.component.scss'],
})
export class ProductOptionsComponent implements OnInit {

  thisSection = 'options'
  @Input() parent: EditProductComponent

  _product: Product
  @Input() set product(value: Product) {
    this._product = value

    if (value) {
      if (!value.options)
        value.options = []

      this.optionChanges = new CollectionChangeTracker<ProductOption>(value.options, ProductOption, {
        propsToUpdate: ['name', 'required', 'multiSelect', 'hasDuration', 'hasValue', 'hasPrice', 'pvt', 'hasFormula', 'formula'],
        propsToRemove: ['values']
      })
    }


  }

  get product(): Product {
    return this._product
  }

  ListSectionMode = ListSectionMode
  mode = ListSectionMode.readOnly // readOnly

  optionChanges: CollectionChangeTracker<ProductOption>

  valueChangesPerOption = new Map<ProductOption, CollectionChangeTracker<ProductOptionValue>>

  objNew = new ProductOption()

  optionInEdit?: ProductOption
  optionInEditIdx?: number

  valueInEdit?: ProductOptionValue
  valueInEditIdx?: number


  formulaTerm = new FormulaTerm()


  constructor(protected productOptionSvc: ProductOptionService
    , protected productOptionValueSvc: ProductOptionValueService
    , protected sessionSvc: SessionService, protected productSvc: ProductService) {

  }


  getOptionName(optionId: string) {

    if (!this.product?.options)
      return ''

    const option = this.product.options.find(o => o.id == optionId)

    return option?.name
  }

  addFormulaTerm(option: ProductOption) {

    if (!option.formula)
      option.formula = []

    option.formula.push(this.formulaTerm)

    this.formulaTerm = new FormulaTerm()

  }

  removeTerm(option: ProductOption, idx: number) {

    if (!option?.formula)
      return

    option.formula.splice(idx, 1)

  }

  getValueChangeTracker(option: ProductOption) {

    var valueChanges = this.valueChangesPerOption.get(option)

    if (valueChanges) {
      console.warn('value changes from CACHE !!!!!!!!!!!!!!!!!!')
      return valueChanges
    } else {

      console.warn('value changes create ....................')
      if (!option.values)
        option.values = []

      let valueChanges = new CollectionChangeTracker<ProductOptionValue>(option.values, ProductOptionValue, {
        propsToUpdate: ['name', 'duration', 'value', 'price', 'pvt', 'default']
      })

      this.valueChangesPerOption.set(option, valueChanges)

      return valueChanges
    }
  }

  ngOnInit(): void {
    console.warn('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.warn(this.product)
  }

  sectionInEdit(mode?: ListSectionMode) {

    if (!mode)
      return this.parent.editSectionId === this.thisSection
    else
      return this.parent.editSectionId === this.thisSection && this.mode === mode
  }

  // sectionInEditAndMode(mode: ListSectionMode) {
  //   return this.sectionInEdit() && this.mode === mode
  // }


  isValueInEdit(valueId: string) {
    return this.sectionInEdit() && this.valueInEdit?.id === valueId
  }

  startAddValue(option: ProductOption) {

    let valueChanges = this.getValueChangeTracker(option)

    const newValue = new ProductOptionValue()
    newValue.optionId = option.id

    const idxStep = 100
    if (option.values.length > 0) {
      var valueMaxIdx = _.maxBy(option.values, 'idx')
      newValue.idx = valueMaxIdx.idx + idxStep
    } else {
      newValue.idx = idxStep
    }

    valueChanges.add(newValue)
    this.valueInEdit = newValue

  }

  startAdd() {
    this.objNew = new ProductOption()
    this.objNew.productId = this.product.id
    this.mode = ListSectionMode.createNew
  }



  cancel() {
    this.parent.cancel()
    this.stopEditMode()

  }

  cancelAdd() {
    this.stopEditMode()
    // this.parent.cancel()
  }

  add() {
    const idxStep = 100

    if (this._product.options.length > 0) {

      var option = _.maxBy(this._product.options, 'idx')
      this.objNew.idx = option.idx + idxStep

    } else {
      this.objNew.idx = idxStep
    }



    this.optionChanges.add(this.objNew)
    this.objNew = new ProductOption()
    this.mode = ListSectionMode.readOnly
  }

  toggleEditOption(event: Event, option: ProductOption, optionIdx: number) {

    event.stopPropagation()


    if (optionIdx != this.optionInEditIdx) {
      this.optionInEdit = option
      this.optionInEditIdx = optionIdx
      this.optionChanges.update(option)
    } else {
      this.optionInEdit = undefined
      this.optionInEditIdx = undefined
    }

    console.error(this.optionInEdit)
    console.error(this.optionInEditIdx)

    console.warn(JSON.stringify(option.formula))

  }


  toggleEditOptionValue(event: Event, option: ProductOption, optionIdx: number, value: ProductOptionValue, valueIdx: number) {

    console.error(value)

    let valueChanges = this.getValueChangeTracker(option)
    valueChanges.update(value)

    if (value != this.valueInEdit) {
      this.valueInEdit = value
      this.valueInEditIdx = valueIdx
      // this.optionChanges.update(option)
    } else {
      this.valueInEdit = undefined
      this.valueInEditIdx = undefined
    }

  }


  // showOptionDetails(option: ProductOption, idx: number) {

  //   if (idx != this.optionInEditIdx) {
  //     this.optionInEdit = option
  //     this.optionInEditIdx = idx
  //   } else {
  //     this.optionInEdit = undefined
  //     this.optionInEditIdx = undefined
  //   }
  // }

  deleteOption(option: ProductOption) {

    this.optionChanges.delete(option)

  }

  deleteOptionValue(option: ProductOption, value: ProductOptionValue) {

    let valueChanges = this.getValueChangeTracker(option)
    valueChanges.delete(value)
  }

  /** If product option does not allow multi select: then we need to deselect all others */
  defaultChanged(option: ProductOption, value: ProductOptionValue, checked: boolean) {

    if (option.multiSelect)
      return


    let otherDefaults = option.values.filter(val => val.id != value.id && val.default)

    if (otherDefaults?.length > 0) {

      let valueChanges = this.getValueChangeTracker(option)

      otherDefaults.forEach(val => {
        val.default = false
        valueChanges.update(val)
      })

    }

  }

  /** if option.multiSelect, then make sure there is only 1 default value  */
  multiSelectChanged(option: ProductOption, checked: boolean) {

    if (checked)
      return

    let defaultValues = option.values.filter(val => val.default)

    // if more then 1 default options, then remove defaults
    if (defaultValues?.length > 1) {

      let valueChanges = this.getValueChangeTracker(option)

      let first = true
      defaultValues.forEach(val => {
        if (first) {
          first = false
          return
        }
        val.default = false
        valueChanges.update(val)
      })

    }

  }

  async save(): Promise<any> {

    var optionsResult = await this.saveOptions()

    console.warn(optionsResult)

    var allResults = new ApiMultiResult(optionsResult)

    await this.saveAllOptionValues(allResults)


    this.mode = ListSectionMode.readOnly

    if (allResults.status == ApiStatus.error) {
      this.parent.dashboardSvc.showToastType(ToastType.saveError)
      console.error(allResults)
    } else {
      this.parent.dashboardSvc.showToastType(ToastType.saveSuccess)
      this.optionChanges.reset()
      await this.productSvc.refreshCachedObjectFromBackend(this._product.id)
    }

    this.optionChanges?.reset()
    this.stopEditMode()

  }





  async saveOptions(): Promise<any> {



    const me = this

    return new Promise<any>(function (resolve, reject) {

      const batch = me.optionChanges.getApiBatch()

      if (!batch.hasChanges()) {
        // this.parent.dashboardSvc.showToastType(ToastType.saveNoChanges)
        // this.stopEditMode()
        resolve(null)
        return
      }

      me.productOptionSvc.batchProcess(batch).subscribe(res => {

        if (res.status == ApiStatus.ok)
          me.optionChanges.reset()

        resolve(res)

        /*
        this.mode = ListSectionMode.readOnly

        if (res.status == ApiStatus.error) {
          this.parent.dashboardSvc.showToastType(ToastType.saveError)
        } else {
          this.parent.dashboardSvc.showToastType(ToastType.saveSuccess)
          this.optionChanges.reset()
        }

        console.error(res)
        this.optionChanges?.reset()
        this.stopEditMode()
        */

      })
    })
  }

  async saveAllOptionValues(results: ApiMultiResult): Promise<any> {

    if (!this.valueChangesPerOption || this.valueChangesPerOption.size === 0) {
      return 'no work'
    }

    for (let valueChanges of this.valueChangesPerOption.values()) {
      var res = await this.saveOptionValues(valueChanges)
      results.addSingle(res)
    }

    return results

  }

  async saveOptionValues(valueChanges: CollectionChangeTracker<ProductOptionValue>): Promise<any> {

    const me = this

    return new Promise<any>(function (resolve, reject) {

      const batch = valueChanges.getApiBatch()


      if (!batch.hasChanges()) {
        resolve('No work')
        return
      }

      console.warn(batch)

      me.productOptionValueSvc.batchProcess(batch).subscribe(res => {

        console.error(res)

        if (res.status == ApiStatus.ok)
          valueChanges.reset()

        resolve(res)

      })



    })

  }


  saveOptionsOld() {

    const batch = this.optionChanges.getApiBatch()

    if (!batch.hasChanges()) {
      this.parent.dashboardSvc.showToastType(ToastType.saveNoChanges)
      this.stopEditMode()
      return
    }

    this.productOptionSvc.batchProcess(batch).subscribe(res => {

      this.mode = ListSectionMode.readOnly

      if (res.status == ApiStatus.error) {
        this.parent.dashboardSvc.showToastType(ToastType.saveError)
      } else {
        this.parent.dashboardSvc.showToastType(ToastType.saveSuccess)
        this.optionChanges.reset()
      }

      console.error(res)
      this.optionChanges?.reset()
      this.stopEditMode()

    })

  }



  stopEditMode() {
    this.mode = ListSectionMode.readOnly
    this.parent.editSectionId = ''
    this.optionInEdit = null
    this.optionInEditIdx = -1
  }





}
