import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BankTransactionsComponent } from './bank-transactions/bank-transactions.component';
import { OrderCheckComponent } from './order-check/order-check.component';

const routes: Routes = [
  { path: "transactions", component: BankTransactionsComponent },
  { path: "checks", component: OrderCheckComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountingRoutingModule { }
