import { Component, ViewChild } from '@angular/core';
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
export class ManageProductsComponent {

  @ViewChild('productList') public productListComponent: ProductListComponent;

  constructor(public manageProductSvc: ManageProductService, protected route: ActivatedRoute
    , protected router: Router, protected sessionSvc: SessionService) {


    this.route.params.subscribe(params => {

      console.error('manage-products')
      console.error(params)

    })
  }


  selectProduct(product: Product) {

    if (product.isCategory) {
      this.manageProductSvc.showPath(product.id)
      // this.showProductsInCategory(product.id)
    }

    this.productListComponent.categoryId = product.id
    this.productListComponent.getListObjects()

    
    const productType = this.productListComponent.productType

    if (product?.id)
      this.router.navigate(['/' + this.sessionSvc.branch + '/catalog/' + productType, product.id])
    else
      this.router.navigate(['/' + this.sessionSvc.branch + '/catalog/' + productType])


  }



}
