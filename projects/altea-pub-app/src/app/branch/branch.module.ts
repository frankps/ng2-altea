import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BranchRoutingModule } from './branch-routing.module';
import { BranchComponent } from './branch/branch.component';
import { MenuComponent } from './menu/menu.component';
import { NgAlteaCommonModule } from 'ng-altea-common';
import { OrderMgrModule } from 'ng-altea-common';

@NgModule({
  declarations: [
    BranchComponent,
    MenuComponent
  ],
  imports: [
    CommonModule,
    BranchRoutingModule,
    NgAlteaCommonModule,
    OrderMgrModule
  ]
})
export class BranchModule { }
