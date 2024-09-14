import { Component, OnInit } from '@angular/core';
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
export class BrowseCatalogComponent implements OnInit {

  categories: Product[] = []

  serviceCats: Product[] = []
  productCats: Product[] = []

  constructor(protected orderMgrSvc: OrderMgrUiService, private productSvc: ProductService, protected spinner: NgxSpinnerService) {

    //     this.showRootFolders()




  }




  ngOnInit(): void {


    this.orderMgrSvc.modeChanges.subscribe(newState => {

      console.warn(newState)

      if (newState == 'showRootFolders')
        this.showRoot()

      //console.error(newState)

    })


  }



  showRoot() {

    this.orderMgrSvc.showRootCategories()
  }

  showCategory(category) {

    this.orderMgrSvc.showProductsInCategory(category)

  }

  /* 
    showRootFolders() {
  
      this.spinner.show()  
  
      this.productSvc.getAllCategories().pipe(take(1)).subscribe(res => {
        this.categories = res
  
        this.serviceCats = this.categories.filter(cat => cat.type == ProductType.service)
  
        this.productCats = this.categories.filter(cat => cat.type == ProductType.product)
        console.error(res)
  
        this.spinner.hide()
      })
  
    }
  
    selectCategory(category: Product) {
      this.orderMgrSvc.showProductsInCategory(category)
    }
   */






}
