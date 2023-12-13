import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductListComponent } from './product-list/product-list.component';
import { EditProductComponent } from './edit-product/edit-product.component';
import { ManageProductsComponent } from './manage-products/manage-products.component';

const routes: Routes = [
  {
    path: ":type", component: ManageProductsComponent,
    children: [
      { path: ":id", component: EditProductComponent },
      { path: "new/:type", component: EditProductComponent },
    ]
  },
  { path: "manage", component: ManageProductsComponent },
  { path: "list", component: ProductListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductRoutingModule { }
