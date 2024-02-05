import { Component, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ManageProductService } from '../manage-product.service';
import { Product, ProductType, ProductTypeIcons } from 'ts-altea-model'
import { ProductListComponent } from '../product-list/product-list.component';
import { SessionService } from 'ng-altea-common'

@Component({
  selector: 'ngx-altea-manage-products',
  templateUrl: './manage-products.component.html',
  styleUrls: ['./manage-products.component.scss'],
})
export class ManageProductsComponent implements OnInit {

  @ViewChild('productList') public productListComponent: ProductListComponent;

  constructor(public manageProductSvc: ManageProductService, protected route: ActivatedRoute
    , protected router: Router, protected sessionSvc: SessionService) {
  }

  async ngOnInit() {

    /** why is this NOT triggered */

    this.route.parent.params.subscribe(sub => {

      console.warn(sub)

    })

    if (this.route.firstChild) {
      this.route.firstChild.params.subscribe(sub => {

        console.warn(sub)
  
      })

    }


    this.route.params.subscribe(params => {

      console.error('manage-products')
      console.error(params)

      this.manageProductSvc.showPath()

    })

  }


  async selectProduct(product: Product) {

    console.error(product)

    if (!product.id) {
      await this.manageProductSvc.setRootPathName()
      this.manageProductSvc.showRootPathOnly()

    } else if (product.isCategory()) {
      this.manageProductSvc.showPath(product.id)
      // this.showProductsInCategory(product.id)
    }

    this.productListComponent.categoryId = product.id
    this.productListComponent.getListObjects()

    
    const productType = this.productListComponent.productType

    if (product?.id)
      this.router.navigate(['/' + this.sessionSvc.branch.unique + '/catalog/' + productType, product.id])
    else
      this.router.navigate(['/' + this.sessionSvc.branch.unique + '/catalog/' + productType])


  }



}
