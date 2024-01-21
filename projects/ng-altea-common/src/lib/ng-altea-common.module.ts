import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RequestGiftComponent } from './gift/request-gift/request-gift.component';
import { TranslateModule } from '@ngx-translate/core';
import { Bootstrap5Module } from 'ng-common';
import { FormsModule } from '@angular/forms';
import { MainMenuComponent } from './app/main-menu/main-menu.component';
import { RedeemGiftComponent } from './gift/redeem-gift/redeem-gift.component';
import { OrderMgrModule } from './order-mgr/order-mgr.module';
import { RequestInvoiceComponent } from './invoice/request-invoice/request-invoice.component';
import { NgSelectModule } from '@ng-select/ng-select';
@NgModule({
  imports: [CommonModule,
  HttpClientModule,
  TranslateModule,
  Bootstrap5Module,
  FormsModule,
  NgSelectModule
],
  declarations: [
    RequestGiftComponent,
    MainMenuComponent,
    RedeemGiftComponent,
    RequestInvoiceComponent
  ],
  exports: [
    RequestGiftComponent,
    RedeemGiftComponent,
    RequestInvoiceComponent,
    MainMenuComponent,
    OrderMgrModule
  ]
})
export class NgAlteaCommonModule {}
