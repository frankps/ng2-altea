import { Component, ViewChild, OnInit, Input } from '@angular/core';
import { ProductService, PriceService, ProductResourceService, ProductOptionService, SessionService, ProductOptionValueService, ProductItemService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, ProductType, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, ProductOptionValue, ProductItem, ProductItemOptionValue, ProductSubType, ProductItemOptionMode } from 'ts-altea-model'
import { DashboardService, FormCardSectionEventData, NgEditBaseComponent, ToastType, TranslationService } from 'ng-common'
import { ActivatedRoute, Router } from '@angular/router';
import { NgxModalComponent, DeleteModalComponent } from 'ng-common';
import { BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, Translation, ObjectHelper, CollectionChangeTracker, ObjectWithId, ApiStatus, ListSectionMode, ApiMultiResult, DbQuery, QueryOperator } from 'ts-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { ManageProductService } from '../manage-product.service';
import { NgTemplateOutlet } from '@angular/common';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as sc from 'stringcase'
import { ConnectTo } from 'ts-common'
import { EditProductComponent } from '../edit-product/edit-product.component';
import { SearchProductComponent } from '../search-product/search-product.component';


@Component({
  selector: 'ngx-altea-product-items',
  templateUrl: './product-items.component.html',
  styleUrls: ['./product-items.component.scss'],
})
export class ProductItemsComponent implements OnInit {

  @ViewChild('searchProductModal') public searchProductModal: SearchProductComponent;

  Array = Array

  thisSection = 'items'

  ProductType = ProductType
  ProductSubType = ProductSubType

  @Input() parent: EditProductComponent

  _product: Product
  @Input() set product(value: Product) {
    this._product = value

    if (value) {
      if (!value.items)
        value.items = []

      this.itemChanges = new CollectionChangeTracker<ProductItem>(value.items, ProductItem, {
        propsToUpdate: ['idx', 'name', 'qty', 'options', 'optionQty', 'optionId', 'productPrice', 'optionPrice']
        //   propsToRemove: ['values']
      })
    }


  }

  get product(): Product {
    return this._product
  }


  data = {}

  ListSectionMode = ListSectionMode
  mode = ListSectionMode.readOnly // readOnly

  itemChanges: CollectionChangeTracker<ProductItem>

  objNew: ProductItem

  itemInEdit: ProductItem
  itemInEditIdx: number

  dependingProducts: Product[]

  /** the depending product for the currently item in edit */
  dependingProduct: Product

  itemOptionValues: Map<string, ProductItemOptionValue[]> = new Map<string, ProductItemOptionValue[]>()

  // create array from 1 to 20 
  qtyArray = [...Array(20).keys()].map(i => i + 1)


  optionModes: Translation[] = []

  init = false

  constructor(protected productItemSvc: ProductItemService, protected productSvc: ProductService, protected spinner: NgxSpinnerService, 
    protected dashboardSvc: DashboardService, protected translationSvc: TranslationService) {


  }

  
  async ngOnInit() {

    await this.translationSvc.translateEnum(ProductItemOptionMode, 'enums.product-item-option-mode.', this.optionModes)

    this.init = true
  }



  editModeChanged(event: FormCardSectionEventData) {
    this.parent.editModeChanged(event)

    console.warn('editModeChanged')
    console.warn(event)

    if (event.sectionId === this.thisSection && event.editable) {
      this.getDependingProducts()
    }

  }

  getQty(item: ProductItem) {

    if (item.optionQty) {

      let option = this.product.getOption(item?.optionId)

      if (!option)
        return `[???]`
      else
        return `[${option.name}]`

    } else
      return item.qty



  }

  getDependingProducts() {

    let productIds = this.product.items.map(item => item.productId)

    console.warn(productIds)

    const query = new DbQuery()
    query.and('id', QueryOperator.in, productIds)

    query.include('options:orderBy=idx.values:orderBy=idx')

    this.spinner.show()
    this.productSvc.query(query).subscribe(res => {

      this.dependingProducts = res.data
      console.error(res)

      this.convertProductOptionsToItemOptions(this.dependingProducts)

      this.cleanProductItems(this.product.items, this.dependingProducts)
      this.spinner.hide()

    })
  }


  convertProductOptionsToItemOptions(products: Product[]) {

    this.itemOptionValues.clear()

    if (!products)
      return

    for (let product of products) {

      if (!product.options)
        continue

      for (let option of product.options) {

        let productItemOptionValues = option.toProductItemOptionValues()
        this.itemOptionValues.set(option.id, productItemOptionValues)

        // this.itemOptionValues.get(option.id)
      }


    }


  }


  /** Remove product item options that are not in use anymore  */
  cleanProductItems(productItems: ProductItem[], dependingProducts: Product[]) {

    if (!productItems)
      return

    for (let productItem of productItems) {

      let dependingProduct = dependingProducts.find(p => p.id == productItem.productId)
      this.cleanProductItem(productItem, dependingProduct)
    }

  }

  cleanProductItem(productItem: ProductItem, dependingProduct: Product) {

    if (productItem.options) {

      const itemOptionIdsToRemove = []

      for (let itemOption of productItem.options) {

        const prodOption = dependingProduct.options.find(o => o.id == itemOption.id)

        if (!prodOption)
          itemOptionIdsToRemove.push(itemOption.id)

        //option.id

      }

      for (let optionId of itemOptionIdsToRemove) {
        _.remove(productItem.options, o => o.id == optionId)
      }




    }
  }


  sectionInEdit(mode?: ListSectionMode) {

    if (!mode)
      return this.parent.editSectionId === this.thisSection
    else
      return this.parent.editSectionId === this.thisSection && this.sectionInEdit() && this.mode === mode
  }


  startAdd() {
    // this.objNew = new ProductItem()
    // this.objNew.productId = this.product.id
    this.mode = ListSectionMode.createNew
    this.searchProductModal.show()
  }

  searchProduct() {
    this.searchProductModal.show()
  }


  nextIdx(collection: any[], idxProperty = 'idx', step = 100): number {

    if (collection && collection.length > 0) {
      var maxIdx = _.maxBy(collection, idxProperty)
      return maxIdx[idxProperty] + step
    } else
      return step
  }


  addNewProductItem(product: Product) {
    console.warn(product)

    let objNew = new ProductItem()
    objNew.productId = product.id
    objNew.parentId = this.product.id
    objNew.name = product.name
    objNew.idx = this.nextIdx(this.product.items)

    this.itemChanges.add(objNew)


    console.error(this.product.items)

  }

  cancel() {
    this.parent.cancel()
    this.stopEditMode()

  }

  deleteItem(item: ProductItem) {
    this.itemChanges.delete(item)
  }

  toggleEditItem(event, item: ProductItem, idx: number) {

    console.error(item)

    if (idx != this.itemInEditIdx) {
      this.itemInEdit = item
      this.itemInEditIdx = idx

      if (item.productId) {
        this.dependingProduct = this.dependingProducts.find(p => p.id === item.productId)

        // item.options = []

        console.warn(item)

        this.syncProductItemWithProductOption(item, this.dependingProduct)

        console.error(item)
      }
      else
        this.dependingProduct = null

      console.error(this.dependingProduct)

      this.itemChanges.update(item)
    } else {

      console.error(item)
      console.warn(this.product.items)

      this.itemInEdit = undefined
      this.itemInEditIdx = undefined
    }
  }

  syncProductItemWithProductOption(item: ProductItem, product: Product) {

    if (!item || !product)
      return

    if (!product.options)
      product.options = []

    for (let option of product.options) {

      // get or create item option
      item.getOption(option, true)
    }




  }

  async save() {

    const batch = this.itemChanges.getApiBatch()

    if (!batch.hasChanges())
      return


    const res = await this.productItemSvc.batchProcess$(batch, this.dashboardSvc.resourceId)

    if (res.status == ApiStatus.ok) {
      this.itemChanges.reset()
      this.parent.dashboardSvc.showToastType(ToastType.saveSuccess)


      await this.productSvc.refreshCachedObjectFromBackend(this._product.id)

      this.stopEditMode()
    } else {
      this.parent.dashboardSvc.showToastType(ToastType.saveError)
    }




  }


  stopEditMode() {

    this.mode = ListSectionMode.readOnly
    this.parent.editSectionId = ''
    this.itemInEdit = null
    this.itemInEditIdx = -1


  }

}
