import { Component, OnInit, ViewChild } from '@angular/core';
import { Product, ProductSubType, ProductType, ProductTypeIcons } from 'ts-altea-model'
import { ApiListResult, DbQuery, QueryOperator, Translation, ApiResult, ApiStatus, ConnectTo } from 'ts-common'
import { ProductService, SessionService } from 'ng-altea-common'
import { Observable } from 'rxjs';
import { TranslationService } from 'ng-common'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner"
import * as _ from "lodash";
import { ManageProductService } from '../manage-product.service';


@Component({
  selector: 'ngx-altea-new-product',
  templateUrl: './new-product.component.html',
  styleUrls: ['./new-product.component.scss'],
})
export class NewProductComponent implements OnInit {

  @ViewChild('productTypeModal') public selectTypeModal: NgTemplateOutlet | null = null

  ProductTypeIcons = ProductTypeIcons
  ProductType = ProductType
  productTypes: Translation[] = []

  step = 1
  nrOfSteps = 2

  message = ''

  productOrFolder = 'product'

  newProduct: Product = new Product()

  productType: string

  constructor(private productSvc: ProductService, private sessionSvc: SessionService, public manageProductSvc: ManageProductService, private translationSvc: TranslationService, private modalService: NgbModal, protected route: ActivatedRoute, private router: Router, protected spinner: NgxSpinnerService) {

  }

  async ngOnInit() {
    this.translationSvc.translateEnum(ProductType, 'enums.product-type.', this.productTypes)
  }

  isFolder() {
    return (this.productOrFolder == 'folder')
  }


  show(productType: ProductType) {

    this.newProduct = new Product()
    this.newProduct.type = productType

    this.modalService.open(this.selectTypeModal)

    this.step = 1
  }


  createProduct(modal: NgbActiveModal | null = null) {

    this.spinner.show()

    //this.newProduct.organisation = new ConnectTo("66e77bdb-a5f5-4d3d-99e0-4391bded4c6c")
    // this.newProduct.branch = new ConnectTo("66e77bdb-a5f5-4d3d-99e0-4391bded4c6c")

    this.newProduct.orgId = this.sessionSvc.orgId
    this.newProduct.branchId = this.sessionSvc.branchId

    if (this.isFolder())
      this.newProduct.sub = ProductSubType.cat
    else
      this.newProduct.sub = ProductSubType.basic


    this.productSvc.create(this.newProduct).subscribe((res: ApiResult<Product>) => {

      console.log('Object saved')
      console.error(res)

      if (res.status != ApiStatus.ok) {
        this.message = res.message.split('\n')[0]
        this.step = -1
      }

      if (res.status == ApiStatus.ok) {
        if (modal)
          modal.close()

        console.error(this.router.getCurrentNavigation())

        const url = `/aqua/catalog/${this.newProduct.type}/` + res.object.id

        console.error(url)

        this.router.navigate([url])
      }

      this.spinner.hide()
    })

  }

  selectProductType(productType: string) {

    this.newProduct.type = productType as ProductType

    this.step++

  }


}
