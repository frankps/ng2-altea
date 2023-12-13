import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrderGridComponent } from './order-grid/order-grid.component';

const routes: Routes = [
  { path: "", component: OrderGridComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrderRoutingModule { }
