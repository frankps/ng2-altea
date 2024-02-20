import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StaffRoutingModule } from './staff-routing.module';
import { TasksComponent } from './tasks/tasks.component';
import { NgAlteaCommonModule } from 'ng-altea-common';
import { OrderMgrModule } from 'ng-altea-common';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TaskComponent } from './task/task.component';

@NgModule({
  declarations: [
    TasksComponent,
    DashboardComponent,
    TaskComponent
  ],
  imports: [
    CommonModule,
    StaffRoutingModule,
    NgAlteaCommonModule,
    OrderMgrModule
  ]
})
export class StaffModule { }
