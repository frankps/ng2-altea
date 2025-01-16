import { Component } from '@angular/core';
import { Year } from '@syncfusion/ej2-angular-schedule';
import { ObjectService, OrderService } from 'ng-altea-common';
import { ConsistencyReport, MonthConsistencyReportBuilder } from 'ts-altea-logic';
import { YearMonth } from 'ts-common';

@Component({
  selector: 'app-order-check',
  templateUrl: './order-check.component.html',
  styleUrls: ['./order-check.component.scss']
})
export class OrderCheckComponent {


  report: ConsistencyReport

  constructor(protected orderSvc: OrderService, protected objSvc: ObjectService) {


  }


  async doChecks(year, month) {

    let report = new MonthConsistencyReportBuilder(this.objSvc)

    let yearMonth = new YearMonth(year, month)
    // let pays = await report.checkPayments(yearMonth)
    // console.log(pays)

    this.report = await report.checkAll(yearMonth)

    console.log(this.report)

  }

  ordersWithoutPlanning() {

    


  }




}
