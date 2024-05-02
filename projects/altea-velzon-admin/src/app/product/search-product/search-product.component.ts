import { Component, Input, OnDestroy, ViewChild, Output, EventEmitter } from '@angular/core';
import { NgxSpinnerService } from "ngx-spinner"
import * as sc from 'stringcase'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiStatus, DbQuery, ObjectWithId, QueryOperator } from 'ts-common'
import { DashboardService, NgBaseComponent, TranslationService } from 'ng-common'
import { ProductService } from 'ng-altea-common';
import { Product, ProductType, ProductTypeIcons } from 'ts-altea-model';
import { Observable, take, takeUntil } from 'rxjs';
import * as _ from "lodash";
// import { TranslationService } from '../../services/translation.service';
// import { BackendHttpServiceBase } from '../../services/backend-http-service-base';
// import { DashboardService } from '../../services/dashboard.service';


@Component({
  selector: 'ngx-altea-search-product',
  templateUrl: './search-product.component.html',
  styleUrls: ['./search-product.component.scss'],
})
export class SearchProductComponent extends NgBaseComponent implements OnDestroy {

  ProductTypeIcons = ProductTypeIcons

  @ViewChild('searchProductModal') public searchProductModal?: NgbModal; // NgTemplateOutlet | null = null

  @Input() multi: boolean = false
  @Output() select: EventEmitter<Product> = new EventEmitter();
  @Output() selectMulti: EventEmitter<Product[]> = new EventEmitter();

  searchFor: string
  products$
  products: Product[] = []

  selected = {}

  constructor(protected router: Router, protected spinner: NgxSpinnerService, private translationSvc: TranslationService
    , private modalService: NgbModal, private dashboardSvc: DashboardService, private productSvc: ProductService) {
    super()
  }

  override ngOnDestroy() {
    super.ngOnDestroy()   // important: close all open subscriptions
  }

  show() {
    this.searchFor = ''
    this.products = null

    this.selected = {}

    this.modalService.open(this.searchProductModal)
  }

  selectProducts(modal: any) {

    console.warn(this.selected)

    const selectedProducts: Product[] = []

    Object.keys(this.selected).forEach(productId => {

      const product = this.products.find(p => p.id == productId)

      if (product)
        selectedProducts.push(product)
      
    })

    this.selectMulti.emit(selectedProducts)
    modal.close()
  }

  selectProduct(product: Product, modal: any) {

    // in case of multi select we work with checkboxes
    if (this.multi)
      return

    this.select.emit(product)
    modal.close()
  }

  getSearchDbQuery(searchFor: string): DbQuery | null {

    const query = new DbQuery()
    query.and('name', QueryOperator.contains, searchFor)
    query.and('del', QueryOperator.equals, false)

    /*     query.or('type', QueryOperator.equals, ProductType.prod)
        query.or('type', QueryOperator.equals, ProductType.svc) */
    query.take = 10

    return query

  }


  search() {



    this.products$ = null
    const query = this.getSearchDbQuery(this.searchFor)

    if (!query)
      return

    this.spinner.show()

    this.products$ = this.productSvc.query(query)

    this.products$.pipe(takeUntil(this.ngUnsubscribe), take(1)).subscribe(res => {

      if (res?.data)
        this.products = res.data
      else
        this.products = []

      console.error(this.products)


      this.spinner.hide()
    })
  }



}
