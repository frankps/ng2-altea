import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrderGridComponent } from './order-grid/order-grid.component';
import { ManageOrderComponent } from './manage-order/manage-order.component';
import { PaymentsComponent } from './payments/payments.component';

const routes: Routes = [
  { path: "", component: OrderGridComponent},
  { path: "manage", component: ManageOrderComponent },
  { path: "manage/:id", component: ManageOrderComponent },
  { path: "payments", component: PaymentsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrderRoutingModule { }
