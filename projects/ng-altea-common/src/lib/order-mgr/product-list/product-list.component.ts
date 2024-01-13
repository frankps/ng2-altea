import { Component } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { Order, OrderLine, OrderLineOption, Product, ProductType, ProductTypeIcons, Resource } from 'ts-altea-model'



@Component({
  selector: 'order-mgr-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent {

  constructor(protected orderMgrSvc: OrderMgrUiService) {

  }

  productSelected(product: Product) {

    if (!product)
      return

    if (product.isCategory)
      this.orderMgrSvc.showProductsInCategory(product.id)
    else
      this.orderMgrSvc.newOrderLine(product)


  }


  // orderMgrSvc.newOrderLine(product)
}
