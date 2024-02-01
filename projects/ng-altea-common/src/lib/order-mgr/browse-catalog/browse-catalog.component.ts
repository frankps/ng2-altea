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

  serviceCats: Product[] = []
  productCats: Product[] = []

  constructor(protected orderMgrSvc: OrderMgrUiService, private productSvc: ProductService, protected spinner: NgxSpinnerService) {

     this.showRootFolders()

    
    this.orderMgrSvc.orderUiStateChanges.subscribe(newState => {

      console.error(newState)
    
    //  this.showRootFolders()
    })

  }

  showRootFolders() {

    this.spinner.show()  

    // ProductType.service
    this.productSvc.getAllCategories().pipe(take(1)).subscribe(res => {
      this.categories = res

      this.serviceCats = this.categories.filter(cat => cat.type == ProductType.service)

      this.productCats = this.categories.filter(cat => cat.type == ProductType.product)
      console.error(res)

      this.spinner.hide()
    })

  }

  selectCategory(category: Product) {
    this.orderMgrSvc.showProductsInCategory(category.id)
  }


}
