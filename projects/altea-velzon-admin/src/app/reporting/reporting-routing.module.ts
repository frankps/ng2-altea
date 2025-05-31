import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BranchReportComponent } from './branch-report/branch-report.component';

const routes: Routes = [
  { path: "branch-report", component: BranchReportComponent },
];

// branch-report.component

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportingRoutingModule { }
