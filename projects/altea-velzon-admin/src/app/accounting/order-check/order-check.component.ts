import { Component } from '@angular/core';
import { Year } from '@syncfusion/ej2-angular-schedule';
import { ObjectService, OrderService, SessionService } from 'ng-altea-common';
import { AlteaDb, ConsistencyReport, MonthClosing, MonthClosingResult, MonthClosingUpdate, MonthConsistencyReportBuilder } from 'ts-altea-logic';
import { YearMonth } from 'ts-common';
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { DashboardService } from 'ng-common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';


@Component({
  selector: 'app-order-check',
  templateUrl: './order-check.component.html',
  styleUrls: ['./order-check.component.scss']
})
export class OrderCheckComponent {

  // branchId = '66e77bdb-a5f5-4d3d-99e0-4391bded4c6c'

  report: ConsistencyReport


  closeResult: MonthClosingResult


  htmlReport: SafeHtml


  constructor(protected orderSvc: OrderService, protected objSvc: ObjectService, protected spinner: NgxSpinnerService, public dashboardSvc: DashboardService,
    public sessionSvc: SessionService, private sanitizer: DomSanitizer
  ) {


  }


  async doChecks(year, month) {

    let branchId = this.sessionSvc.branchId
    let report = new MonthConsistencyReportBuilder(branchId, this.objSvc)

    let yearMonth = new YearMonth(year, month)
    // let pays = await report.checkPayments(yearMonth)
    // console.log(pays)

    this.report = await report.checkAll(yearMonth)

    console.log(this.report)

  }


  calcMonthLog: MonthClosingUpdate[] = []

  async calcMonth(year, month) {

    console.warn(`calcMonth`)

    /*
    let num1 = _.round(9.545, 2)
    let num2 = _.round(9.546, 2)

    return
*/




    let error

    try {
      this.spinner.show()

      let monthClosing = new MonthClosing(this.objSvc)

      let yearMonth = new YearMonth(year, month)

      let closedUntil = new YearMonth(2024, 9)

      let branchId = this.sessionSvc.branchId
      this.closeResult = await monthClosing.calculateMonth(branchId, yearMonth, closedUntil)

      monthClosing.inProgress$.subscribe(upd => {
        this.calcMonthLog.unshift(upd)
      })


    } catch (err) {

      console.error(err)
      error = 'Problem updating WhatsApp template!'

    } finally {

      this.spinner.hide()

      if (error)
        this.dashboardSvc.showErrorToast(error)
      else
        this.dashboardSvc.showSuccessToast('Month finished')

    }





  }



  ordersWithoutPlanning() {




  }


  async showReportMonths() {

    let me = this

    let alteaDb = new AlteaDb(this.objSvc)

    let branchId = me.sessionSvc.branchId
    let months = await alteaDb.getReportMonths(branchId)

    let htmlTable = months.toHtmlTable()

    me.htmlReport = this.sanitizer.bypassSecurityTrustHtml(htmlTable.toString())

    console.log(months)

  }



}
