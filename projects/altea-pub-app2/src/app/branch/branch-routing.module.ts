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
import { UserContactMatchComponent } from './user-contact-match/user-contact-match.component';
import { MyOrdersComponent } from './my-orders/my-orders.component';
import { ProfileComponent } from './profile/profile.component';

const routes: Routes = [{
  path: ':branch', component: BranchComponent,
  children: [
    { path: "menu", component: MenuComponent },
    { path: "order", component: OrderComponent },
    { path: "order/:id/:mode", component: OrderComponent },
    { path: "orderMode/:mode", component: OrderComponent },
    { path: "use-gift", component: UseGiftComponent },
    { path: "buy-gift", component: BuyGiftComponent },
    { path: "pay-online", component: PayOnlineComponent },
    { path: "pay-finished", component: PayFinishedComponent },
    { path: "my-subs", component: MySubsComponent },
    { path: "my-orders", component: MyOrdersComponent },
    { path: "task", component: TaskComponent },
    { path: "profile", component: ProfileComponent },
    { path: "user-contact", component: UserContactMatchComponent },
  ]
}]

// my-subs

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BranchRoutingModule { }



