import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportingRoutingModule } from './reporting-routing.module';
import { BranchReportComponent } from './branch-report/branch-report.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    BranchReportComponent
  ],
  imports: [
    CommonModule,
    ReportingRoutingModule,
    NgxChartsModule,
    FormsModule,
  ], exports: [
    BranchReportComponent
  ]
})
export class ReportingModule { }
