import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductListComponent } from './product-list/product-list.component';
import { EditProductComponent } from './edit-product/edit-product.component';
import { ProductRoutingModule } from './product-routing.module';
import { ManageProductsComponent } from './manage-products/manage-products.component';
import { Bootstrap5Module } from 'ng-common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { ProductPriceComponent } from './product-price/product-price.component';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgCommonModule } from 'ng-common';
import { ProductResourcesComponent } from './edit-product/product-resources/product-resources.component';
import { EditProductResourceComponent } from './edit-product/edit-product-resource/edit-product-resource.component';
import { NewProductComponent } from './new-product/new-product.component';
import { ProductOptionsComponent } from './product-options/product-options.component';
import { ProductItemsComponent } from './product-items/product-items.component';
import { SearchProductComponent } from './search-product/search-product.component';
import { ProductRuleComponent } from './product-rule/product-rule.component';
import { ProductRulesComponent } from './product-rules/product-rules.component';
import { ProductPlanningComponent } from './product-planning/product-planning.component';

@NgModule({
  declarations: [
    ProductListComponent,
    EditProductComponent,
    ManageProductsComponent,
    ProductPriceComponent,
    ProductResourcesComponent,
    EditProductResourceComponent,
    NewProductComponent,
    ProductOptionsComponent,
    ProductItemsComponent,
    SearchProductComponent,
    ProductRuleComponent,
    ProductRulesComponent,
    ProductPlanningComponent,
  ],
  imports: [
    CommonModule,
    NgbModule,
    ProductRoutingModule,
    Bootstrap5Module,
    FormsModule,
    NgSelectModule,
    TranslateModule,
    ModalModule,
    BsDatepickerModule,
    NgxSpinnerModule,
    NgCommonModule,
  ],
  exports: [
    SearchProductComponent
  ]
})
export class ProductModule {}
