import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StaffDashboardComponent } from './staff-dashboard/staff-dashboard.component';
import { HrDashboardComponent } from './hr-dashboard/hr-dashboard.component';

const routes: Routes = [
  { path: "", component: StaffDashboardComponent },
  { path: "dashboard", component: StaffDashboardComponent },
  { path: "hr-dashboard", component: HrDashboardComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StaffRoutingModule { }
