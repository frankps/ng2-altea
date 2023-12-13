import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ManageOrderComponent } from './manage-order/manage-order.component';

const routes: Routes = [
  { path: "", component: ManageOrderComponent },
  { path: ":id", component: ManageOrderComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrderMgrRoutingModule { }
