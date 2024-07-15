import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BankTransactionsComponent } from './bank-transactions/bank-transactions.component';

const routes: Routes = [
  { path: "transactions", component: BankTransactionsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountingRoutingModule { }
