import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BranchComponent } from './branch/branch.component';
import { MenuComponent } from './menu/menu.component';
import { OrderComponent } from './order/order.component';
import { UseGiftComponent } from './use-gift/use-gift.component';
import { BuyGiftComponent } from './buy-gift/buy-gift.component';
import { PayFinishedComponent } from './pay-finished/pay-finished.component';
import { PayOnlineComponent } from './pay-online/pay-online.component';

import { TaskComponent } from './task/task.component';
import { MySubsComponent } from './my-subs/my-subs.component';

const routes: Routes = [{
  path: ':branch', component: BranchComponent,
  children: [
    { path: "menu", component: MenuComponent },
    { path: "order", component: OrderComponent },
    { path: "use-gift", component: UseGiftComponent },
    { path: "buy-gift", component: BuyGiftComponent },
    { path: "pay-online", component: PayOnlineComponent },
    { path: "pay-finished", component: PayFinishedComponent },
    { path: "my-subs", component: MySubsComponent },
    { path: "task", component: TaskComponent },
  ]
}]

// my-subs

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BranchRoutingModule { }
