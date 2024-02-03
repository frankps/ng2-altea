import { Component, Output, EventEmitter } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { Order, OrderLine, OrderLineOption, Product, ProductType, ProductTypeIcons, Resource } from 'ts-altea-model'



@Component({
  selector: 'order-mgr-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent {

  @Output() productSelected: EventEmitter<Product> = new EventEmitter<Product>();
/* 
  productCats: Product[]
  serviceCats: Product[] */


  constructor(protected orderMgrSvc: OrderMgrUiService) {

    if (!Array.isArray(orderMgrSvc.path) || orderMgrSvc.path.length == 0)
      this.showRootFolders()
  }

  async showRootFolders() {

    console.warn('showRootFolders')

    await this.orderMgrSvc.showRootCategories()
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



    if (product.isCategory)
      this.orderMgrSvc.showProductsInCategory(product)
    else {
      this.orderMgrSvc.newOrderLine(product)
      this.productSelected.emit(product)
    }

  }


  // orderMgrSvc.newOrderLine(product)
}
