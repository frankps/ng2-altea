import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountingRoutingModule } from './accounting-routing.module';
import { BankTransactionsComponent } from './bank-transactions/bank-transactions.component';

// Generic imports
import { Bootstrap5Module, NgCommonModule } from 'ng-common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';
import { EditInvoiceComponent } from './edit-invoice/edit-invoice.component';
import { OrderCheckComponent } from './order-check/order-check.component';
import { InterfaceModule } from 'ng-altea-common';

@NgModule({
  declarations: [
    BankTransactionsComponent,
    EditInvoiceComponent,
    OrderCheckComponent
  ],
  imports: [
    CommonModule,
    AccountingRoutingModule,
    NgbModule,
    Bootstrap5Module,
    FormsModule,
    NgSelectModule,
    TranslateModule,
    ModalModule,
    BsDatepickerModule,
    TimepickerModule,
    NgxSpinnerModule,
    InterfaceModule,
    NgCommonModule
  ],
  exports: [
  //  EditInvoiceComponent
  ]
})
export class AccountingModule { }
