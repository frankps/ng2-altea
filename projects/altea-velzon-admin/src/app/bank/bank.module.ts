import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BankRoutingModule } from './bank-routing.module';
import { BankTransactionsComponent } from './bank-transactions/bank-transactions.component';


@NgModule({
  declarations: [
    BankTransactionsComponent
  ],
  imports: [
    CommonModule,
    BankRoutingModule
  ]
})
export class BankModule { }
