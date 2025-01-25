import { Component, OnInit } from '@angular/core';
import { Year } from '@syncfusion/ej2-angular-schedule';
import { BranchService, ObjectService, OrderService, SessionService } from 'ng-altea-common';
import { AlteaDb, ConsistencyReport, MonthClosing, MonthClosingResult, MonthClosingUpdate, MonthConsistencyReportBuilder } from 'ts-altea-logic';
import { YearMonth } from 'ts-common';
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { DashboardService } from 'ng-common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Branch } from 'ts-altea-model';
import { NgZone } from '@angular/core';

@Component({
  selector: 'app-order-check',
  templateUrl: './order-check.component.html',
  styleUrls: ['./order-check.component.scss']
})
export class OrderCheckComponent implements OnInit {

  // branchId = '66e77bdb-a5f5-4d3d-99e0-4391bded4c6c'

  report: ConsistencyReport


  closeResult: MonthClosingResult


  htmlReport: SafeHtml

  branch: Branch


  constructor(protected orderSvc: OrderService, protected objSvc: ObjectService, protected spinner: NgxSpinnerService, public dashboardSvc: DashboardService,
    public sessionSvc: SessionService, private sanitizer: DomSanitizer, public branchSvc: BranchService, private ngZone: NgZone
  ) {


  }


  async ngOnInit() {

    this.branch = await this.sessionSvc.branch$()

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


  private getNextYearMonth(): YearMonth {
    let closed = this.branch.acc.closed

    let yearMonth = new YearMonth(closed.year, closed.month)

    let nextMonth = yearMonth.next()

    return nextMonth
  }

  getNextMonth() {

    let nextMonth = this.getNextYearMonth()

    return nextMonth.toString()
  }

  async calcNextMonth() {

    let nextMonth = this.getNextYearMonth()

    await this.calcMonth(nextMonth.y, nextMonth.m)

    console.log(nextMonth)
  }

  async closeNextMonth() {

    let nextMonth = this.getNextYearMonth()

    let branch = await this.sessionSvc.branch$()
    this.branch = branch

    branch.acc.closed.year = nextMonth.y
    branch.acc.closed.month = nextMonth.m

    let update = {
      id: branch.id,
      acc: branch.acc
    }

    var res = await this.branchSvc.update$(update)

    console.log(res)

  }

  async calcMonth(year, month) {

    console.warn(`calcMonth`)

    /*
    let num1 = _.round(9.545, 2)
    let num2 = _.round(9.546, 2)

    return
*/

    let me = this



    let error

    try {
      this.spinner.show()

      this.calcMonthLog = []

      let monthClosing = new MonthClosing(this.objSvc)

      let yearMonth = new YearMonth(year, month)

      let closedUntil = yearMonth.previous()

      let branchId = this.sessionSvc.branchId

      let subscription = monthClosing.inProgress$.subscribe(upd => {


        me.ngZone.run(() => {

          this.calcMonthLog.unshift(upd)


        });


      })

      this.closeResult = await monthClosing.calculateMonth(branchId, yearMonth, closedUntil)

      console.error(this.closeResult)

      subscription.unsubscribe()



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
