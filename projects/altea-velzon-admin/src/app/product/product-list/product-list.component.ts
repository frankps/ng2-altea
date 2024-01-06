import { Component, OnInit, ViewChild } from '@angular/core';
import { Product, ProductType, ProductTypeIcons } from 'ts-altea-model'
import { ApiListResult, DbQuery, QueryOperator, Translation, ApiResult, ApiStatus, CollectionChangeTracker } from 'ts-common'
import { ProductService, SessionService } from 'ng-altea-common'
import { DashboardService, TranslationService, NgBaseListComponent, ToastType } from 'ng-common'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner"
import * as _ from "lodash";
import { ManageProductService } from '../manage-product.service';
import { NewProductComponent } from '../new-product/new-product.component';
import { Observable, take, takeUntil } from 'rxjs';

@Component({
  selector: 'ngx-altea-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent extends NgBaseListComponent<Product> implements OnInit {

  @ViewChild('moveModal') public moveModal?: NgbModal; // NgTemplateOutlet | null = null

  @ViewChild('newModal') public newModal: NewProductComponent;

  ProductTypeIcons = ProductTypeIcons
  // objects$: Observable<ApiListResult<Product>>

  searchFor = ''
  currentId?: string

  categoryId: string
  productType: string

  // used for moving products
  categories: Product[]
  newCategoryId: string


  constructor(private productSvc: ProductService, public manageProductSvc: ManageProductService, private translationSvc: TranslationService, private modalService: NgbModal,
    dashboardSvc: DashboardService, protected route: ActivatedRoute, router: Router, spinner: NgxSpinnerService
    , protected sessionSvc: SessionService) {
    super(['name'], { searchEnabled: true, addEnabled: true, path: 'products' }
      , productSvc, dashboardSvc, spinner, router)
  }

  override objectsRetrieved(objects: Product[]) {

    // code to quickly debug move
    /*
    this.editMode = true

    if (objects.length > 1) {
      this.selectedIds.push(objects[0].id)
      console.warn(objects[0])
      this.selectedIds.push(objects[1].id)
      console.warn(objects[1])
    }

    this.startMoveSelected()
    */
  }

  checkboxChanged(product: Product, event: Event) {
    // this.selected[product.id] = event.target['checked']

    var alreadyInList = false

    var idx = this.selectedIds.indexOf(product.id)
    if (idx >= 0)
      alreadyInList = true

    if (event.target['checked']) {
      if (!alreadyInList)
        this.selectedIds.push(product.id)
    }
    else {
      if (alreadyInList)
        this.selectedIds.splice(idx, 1)
    }

    console.error(this.selectedIds)

  }

  startMoveSelected() {

    this.categories = this.manageProductSvc.allCategories

    this.categories = _.orderBy(this.categories, 'name')
    this.modalService.open(this.moveModal)
  }

  moveSelected(modal: any) {

    console.warn(this.newCategoryId)

    const changes = new CollectionChangeTracker<Product>(this.objects, Product, {
      propsToUpdate: ['catId']
    })

    this.selectedIds.forEach(id => {
      const product = this.objects.find(p => p.id == id)

      if (this.newCategoryId)
        product.catId = this.newCategoryId
      else
        product.catId = null

      changes.update(product)
    })

    const batch = changes.getApiBatch()
    console.warn(batch)
    this.productSvc.batchProcess(batch).subscribe(res => {

      console.warn(res)

      if (res.status == ApiStatus.ok) {

        // filter out objects that are filtered away
        this.objects = this.objects.filter(p => p.catId == this.categoryId)
        this.dashboardSvc.showToastType(ToastType.saveSuccess)
        modal.close()

      }


    })


  }

  override ngOnDestroy() {
    super.ngOnDestroy()   // important: close all open subscriptions
  }

  async ngOnInit() {
    super._ngOnInit()

    this.route.params.pipe(takeUntil(this.ngUnsubscribe)).subscribe(params => {
      console.error('route PARAMS !!!')
      //console.error(this.route.firstChild.params._value)
      console.error(params)

      const productType = params['type']

      this.categoryId = null

      if (productType != 'any') {
        this.productType = productType

        console.warn(this.productType)

        //this.showProductsInCategory(null)
        // this.showResources(this.productType)
      }

      this.getListObjects()

    })

    if (this.route.firstChild) {
      this.route.firstChild.params.subscribe(params => {

        console.error('product-list PARAMS !!!')
        //console.error(this.route.firstChild.params._value)
        console.error(params)

        if (params && params['id']) {
          this.currentId = params['id']

          // this only works if categories already fetched
          if (this.manageProductSvc.isCategory(this.currentId)) {
            this.categoryId = this.currentId
            this.getListObjects()
          }
          // this.showProductsInCategory(this.currentId)
        }



      })
    } else {
      console.error('product-list NOOOO PARAMS !!!')
      this.getListObjects()
    }


    // this.dashboardSvc.showSearch = true
    // this.dashboardSvc.showAdd = true

    // this.dashboardSvc.search$.subscribe(searchString => {
    //   this.search(searchString)
    // })


    // this.getAllCategories()

  }


  override getInitDbQuery(param?: any): DbQuery | null {

    const query = new DbQuery()
    query.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)
    query.and('catId', QueryOperator.equals, this.categoryId)
    query.and('deleted', QueryOperator.equals, false)

    if (this.categoryId)
      query.and('catId', QueryOperator.equals, this.categoryId)
    else
      query.and('catId', QueryOperator.equals, null)

    //   query.and('type', QueryOperator.equals, 'category')

    query.take = 100
    query.orderBy('name')

    if (this.productType) {
      query.or('type', QueryOperator.equals, this.productType)
      // query.or('type', QueryOperator.equals, ProductType.category)
    }


    return query

  }

  override getSearchDbQuery(searchFor: string): DbQuery | null {

    const query = new DbQuery()
    query.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)
    query.and('name', QueryOperator.contains, searchFor)
    query.and('deleted', QueryOperator.equals, false)

    if (this.productType)
      query.and('type', QueryOperator.equals, this.productType)

    return query

  }


  selectPathItem(item: Product) {

    console.error(item)
    this.selectProduct(item)

  }



  selectProduct(product: Product) {

    if (this.editMode)  // in edit mode we can only check the checkboxes
      return

    if (product.isCategory) {
      //this.manageProductSvc.showPath(product.id)
      this.categoryId = product.id
      this.getListObjects()
    }

    if (product?.id)
      this.router.navigate(['/' + this.sessionSvc.branchUnique + '/catalog/' + this.productType, product.id])
    else
      this.router.navigate(['/' + this.sessionSvc.branchUnique + '/catalog/' + this.productType])

  }


  override addNew() {
    console.log('Add product')
    this.newModal.show()
  }

}
