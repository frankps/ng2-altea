import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BranchRoutingModule } from './branch-routing.module';
import { BranchComponent } from './branch/branch.component';
import { MenuComponent } from './menu/menu.component';
import { NgAlteaCommonModule } from 'ng-altea-common';
import { OrderMgrModule } from 'ng-altea-common';
import { OrderComponent } from './order/order.component';
import { UseGiftComponent } from './use-gift/use-gift.component';

@NgModule({
  declarations: [
    BranchComponent,
    MenuComponent,
    OrderComponent,
    UseGiftComponent
  ],
  imports: [
    CommonModule,
    BranchRoutingModule,
    NgAlteaCommonModule,
    OrderMgrModule
  ]
})
export class BranchModule { }
