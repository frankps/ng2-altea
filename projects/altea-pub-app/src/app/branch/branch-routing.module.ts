import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BranchComponent } from './branch/branch.component';
import { MenuComponent } from './menu/menu.component';

const routes: Routes = [{
  path: ':branch', component: BranchComponent,
  children: [
    { path: "menu", component: MenuComponent }
  ]
}]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BranchRoutingModule { }
