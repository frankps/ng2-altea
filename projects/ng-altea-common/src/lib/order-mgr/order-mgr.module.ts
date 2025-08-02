import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Generic imports
import { NgCommonModule } from 'ng-common';
import { Bootstrap5Module } from 'ng-common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ClipboardModule } from '@angular/cdk/clipboard';


import { OrderMgrRoutingModule } from './order-mgr-routing.module';
import { BrowseCatalogComponent } from './browse-catalog/browse-catalog.component';
//import { ManageOrderComponent } from '../../../../altea-velzon-admin/src/app/order/manage-order/manage-order.component';
import { ProductListComponent } from './product-list/product-list.component';
import { OrderLineComponent } from './order-line/order-line.component';



import { OrderComponent } from './order/order.component';
import { SelectDateComponent } from './select-date/select-date.component';
import { PersonSelectComponent } from './person-select/person-select.component';
import { DebugAvailabilityComponent } from './debug-availability/debug-availability.component';
import { DebugResourceRequestComponent } from './debug-availability/debug-resource-request/debug-resource-request.component';
import { SelectTimeSlotComponent } from './select-time-slot/select-time-slot.component';
import { DemoOrdersComponent } from './demo-orders/demo-orders.component';
import { ContactSelectComponent } from './contact-select/contact-select.component';
import { PosPaymentComponent } from './pos-payment/pos-payment.component';
import { StaffSelectComponent } from './staff-select/staff-select.component';
import { SendOfferComponent } from './send-offer/send-offer.component';
import { SearchContactComponent } from './search-contact/search-contact.component';
import { ContactSelect2Component } from './contact-select2/contact-select2.component';
import { DebugPlanningsComponent } from './debug-plannings/debug-plannings.component';
import { CancelOrderComponent } from './cancel-order/cancel-order.component';
import { LoyaltyComponent } from './loyalty/loyalty.component';

import { DebugMessagingComponent } from './debug-messaging/debug-messaging.component';
import { OrderSummaryComponent } from './order-summary/order-summary.component';
import { OrderDebugComponent } from './order-debug/order-debug.component';
import { OrderDebugInfoComponent } from './order-debug-info/order-debug-info.component'
import { EditInvoiceComponent } from './edit-invoice/edit-invoice.component';
import { PreviewInvoiceComponent } from './preview-invoice/preview-invoice.component';
import { OrderLineOptionComponent } from './order-line/order-line-option/order-line-option.component';
import { VoucherComponent } from './voucher/voucher.component';


@NgModule({
  declarations: [
    BrowseCatalogComponent,
   // ManageOrderComponent,
    ProductListComponent,
    OrderLineComponent,
    OrderComponent,
    SelectDateComponent,
    PersonSelectComponent,
    DebugAvailabilityComponent,
    DebugResourceRequestComponent,
    SelectTimeSlotComponent,
    DemoOrdersComponent,
    ContactSelectComponent,
    PosPaymentComponent,
    StaffSelectComponent,
    SendOfferComponent,
    SearchContactComponent,
    ContactSelect2Component,
    DebugPlanningsComponent,
    CancelOrderComponent,
    LoyaltyComponent,
    DebugMessagingComponent,
    OrderSummaryComponent,
    OrderDebugComponent,
    OrderDebugInfoComponent,
    EditInvoiceComponent,
    PreviewInvoiceComponent,
    OrderLineOptionComponent,
    VoucherComponent
  ],
  imports: [
    CommonModule,
    OrderMgrRoutingModule,
    NgCommonModule,
    NgbModule,
    Bootstrap5Module,
    FormsModule,
    NgSelectModule,
    TranslateModule,
    ModalModule,
    BsDatepickerModule,
    TimepickerModule,
    NgxSpinnerModule,
    ClipboardModule,



    
  ],
  exports: [
    BrowseCatalogComponent,
  //  ManageOrderComponent,
    ProductListComponent,
    OrderLineComponent,
    OrderComponent,
    SelectDateComponent,
    PersonSelectComponent,
    DebugAvailabilityComponent,
    DebugResourceRequestComponent,
    SelectTimeSlotComponent,
    DemoOrdersComponent,
    ContactSelectComponent,
    ContactSelect2Component,
    PosPaymentComponent,
    StaffSelectComponent,
    SendOfferComponent,
    SearchContactComponent,
    DebugPlanningsComponent,
    CancelOrderComponent,
    DebugMessagingComponent,
    OrderSummaryComponent,
    OrderDebugComponent,
    OrderDebugInfoComponent,
    EditInvoiceComponent,
    PreviewInvoiceComponent,
    VoucherComponent
  ]
})
export class OrderMgrModule {}
