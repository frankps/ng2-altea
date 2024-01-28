import { Component } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ProductService } from 'ng-altea-common'
import { Product, ProductType } from 'ts-altea-model';
import { take } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'ngx-altea-browse-catalog',
  templateUrl: './browse-catalog.component.html',
  styleUrls: ['./browse-catalog.component.scss'],
})
export class BrowseCatalogComponent {

  categories: Product[] = []

  constructor(protected orderMgrSvc: OrderMgrUiService, private productSvc: ProductService, protected spinner: NgxSpinnerService) {

    this.showRootFolders()

  }

  showRootFolders() {

    this.spinner.show()

    this.productSvc.getAllCategories(ProductType.service).pipe(take(1)).subscribe(res => {
      this.categories = res
      console.error(res)

      this.spinner.hide()
    })

  }

  selectCategory(category: Product) {
    this.orderMgrSvc.showProductsInCategory(category.id)
  }


}
