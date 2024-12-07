import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderRoutingModule } from './order-routing.module';
import { OrderGridComponent } from './order-grid/order-grid.component';
import { NgCommonModule } from 'ng-common';
import { OrderCardComponent } from './order-card/order-card.component';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { Bootstrap5Module } from 'ng-common';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgAlteaCommonModule, OrderMgrModule } from 'ng-altea-common';
import { ManageOrderComponent } from './manage-order/manage-order.component';
import { PaymentsComponent } from './payments/payments.component';


@NgModule({
  declarations: [OrderGridComponent, OrderCardComponent, ManageOrderComponent, PaymentsComponent],
  imports: [CommonModule,     
    OrderRoutingModule, 
    NgCommonModule, 
    FormsModule, 
    NgbModule, 
    OrderMgrModule,
    BsDatepickerModule,
    Bootstrap5Module,    
    NgSelectModule,
    TranslateModule,
    ModalModule,
    TimepickerModule,
    NgxSpinnerModule,
    NgAlteaCommonModule
   
  ],
})
export class OrderModule { }
