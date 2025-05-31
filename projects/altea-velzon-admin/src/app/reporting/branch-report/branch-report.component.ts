import { Component, OnInit } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
//import { multi } from './data'
import { AlteaService, BranchService, ObjectService, OrderService, ProductService, ResourceService, ScheduleService, SessionService, TemplateService, UserService } from 'ng-altea-common';
import { NgxReportGenerator, ReportOptions } from 'ts-altea-logic';

/**
 * Examples:
 * https://swimlane.github.io/ngx-charts/#/ngx-charts/bar-vertical-stacked
 * 
 */

@Component({
  selector: 'branch-report',
  templateUrl: './branch-report.component.html',
  styleUrls: ['./branch-report.component.scss']
})
export class BranchReportComponent implements OnInit {
  multi: any[]

  view: [number, number] //= [3000, 400];
  
  // options
  legend: boolean = true;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Year';
  yAxisLabel: string = 'Population';
  timeline: boolean = true;

  colorScheme = 'vivid';

  data: any
  /*  
  
  colorScheme = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };
  
  */

  reportGenerator: NgxReportGenerator

  options: ReportOptions = {
    cumul: true,
    showNew: true
  }

  constructor(public dbSvc: ObjectService, public sessionSvc: SessionService) {

  }

  async ngOnInit() {

    await this.loadData()

    this.generateReport()
  }

  generateReport(key?: string, value?: boolean) {

    console.error(key, value)
    if (key)
      this.options[key] = value

    console.error(this.options)
    let chart = this.reportGenerator.create(this.options)

    this.data = chart.toArray()
    console.error(this.data)
  }

  async loadData() {
    
    let branchId = this.sessionSvc.branchId

    let startDate = new Date(2025, 4, 20)
    let endDate = new Date()


    this.reportGenerator = new NgxReportGenerator(this.dbSvc)

    await this.reportGenerator.loadData(branchId, startDate, endDate)
  }

  onSelect(data): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(data)));
  }

  onActivate(data): void {
    console.log('Activate', JSON.parse(JSON.stringify(data)));
  }

  onDeactivate(data): void {
    console.log('Deactivate', JSON.parse(JSON.stringify(data)));
  }
}
