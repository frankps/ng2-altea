import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BranchComponent } from './branch/branch.component';
import { MenuComponent } from './menu/menu.component';
import { OrderComponent } from './order/order.component';
import { UseGiftComponent } from './use-gift/use-gift.component';
import { BuyGiftComponent } from './buy-gift/buy-gift.component';

const routes: Routes = [{
  path: ':branch', component: BranchComponent,
  children: [
    { path: "menu", component: MenuComponent },
    { path: "order", component: OrderComponent },
    { path: "use-gift", component: UseGiftComponent },
    { path: "buy-gift", component: BuyGiftComponent },
  ]
}]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BranchRoutingModule { }
