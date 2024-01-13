import { Component } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ProductService } from 'ng-altea-common'
import { Product, ProductType } from 'ts-altea-model';

@Component({
  selector: 'ngx-altea-browse-catalog',
  templateUrl: './browse-catalog.component.html',
  styleUrls: ['./browse-catalog.component.scss'],
})
export class BrowseCatalogComponent {

  categories: Product[] = []

  constructor(protected orderMgrSvc: OrderMgrUiService, private productSvc: ProductService) {

    this.showRootFolders()

  }

  showRootFolders() {

    this.productSvc.getAllCategories(ProductType.service).subscribe(res => {
      this.categories = res
      console.error(res)
    })

  }

  selectCategory(category: Product) {
    this.orderMgrSvc.showProductsInCategory(category.id)
  }


}
