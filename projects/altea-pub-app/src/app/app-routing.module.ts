import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MenuComponent } from './branch/menu/menu.component';
import { OrderComponent } from './order/order.component';

const routes: Routes = [
  { path: "", component: MenuComponent },
  { path: "menu", component: MenuComponent },
  { path: "order", component: OrderComponent },
  { path: 'branch', loadChildren: () => import('./branch/branch.module').then(m => m.BranchModule)  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
