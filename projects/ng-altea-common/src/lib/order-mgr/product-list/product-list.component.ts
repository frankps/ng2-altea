import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { Order, OrderLine, OrderLineOption, Product, ProductSubType, ProductType, ProductTypeIcons, Resource } from 'ts-altea-model'
import { DashboardService, NgBaseComponent } from 'ng-common';
import { takeUntil } from 'rxjs';
import { NgxSpinnerService } from "ngx-spinner"



@Component({
  selector: 'order-mgr-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent extends NgBaseComponent implements OnInit {

  @Output() productSelected: EventEmitter<Product> = new EventEmitter<Product>();
  /* 
    productCats: Product[]
    serviceCats: Product[] */


  constructor(protected orderMgrSvc: OrderMgrUiService, protected dashboardSvc: DashboardService, protected spinner: NgxSpinnerService) {
    super()

    if (!Array.isArray(orderMgrSvc.path) || orderMgrSvc.path.length == 0)
      this.showRootFolders()
  }

  ngOnInit() {

/*     this.dashboardSvc.search$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(async searchString => {
      await this.orderMgrSvc.searchProducts(searchString)
    })
 */
  }

  async showRootFolders() {

    console.warn('showRootFolders')

    this.spinner.show()

    await this.orderMgrSvc.showRootCategories()

    this.spinner.hide()
    /* 
        if (categories) {
    
          this.productCats = categories.filter(c => c.type == ProductType.product)
          this.serviceCats = categories.filter(c => c.type == ProductType.service)
    
        }
        console.debug(categories) */
  }


  select(product: Product) {

    if (!product)
      return


    if (product.isCategory())
      this.orderMgrSvc.showProductsInCategory(product)
    else {
      this.orderMgrSvc.newOrderLine(product)
      this.productSelected.emit(product)
    }

  }


  // orderMgrSvc.newOrderLine(product)
}
