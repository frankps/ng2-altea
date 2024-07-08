import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BranchRoutingModule } from './branch-routing.module';
import { BranchComponent } from './branch/branch.component';
import { MenuComponent } from './menu/menu.component';
import { NgAlteaCommonModule } from 'ng-altea-common';
import { OrderMgrModule } from 'ng-altea-common';
import { OrderComponent } from './order/order.component';
import { UseGiftComponent } from './use-gift/use-gift.component';
import { BuyGiftComponent } from './buy-gift/buy-gift.component';
import { PayOnlineComponent } from './pay-online/pay-online.component';
import { PayFinishedComponent } from './pay-finished/pay-finished.component';

import { TaskComponent } from './task/task.component';
import { MySubsComponent } from './my-subs/my-subs.component';

@NgModule({
  declarations: [
    BranchComponent,
    MenuComponent,
    OrderComponent,
    UseGiftComponent,
    BuyGiftComponent,
    PayOnlineComponent,
    PayFinishedComponent,

    TaskComponent,
     MySubsComponent
  ],
  imports: [
    CommonModule,
    BranchRoutingModule,
    NgAlteaCommonModule,
    OrderMgrModule
  ]
})
export class BranchModule { }
