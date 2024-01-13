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

  constructor(protected orderMgrSvc: OrderMgrUiService) {

  }

  select(product: Product) {

    if (!product)
      return

    if (product.isCategory)
      this.orderMgrSvc.showProductsInCategory(product.id)
    else {
      this.orderMgrSvc.newOrderLine(product)
      this.productSelected.emit(product)
    }

  }


  // orderMgrSvc.newOrderLine(product)
}
