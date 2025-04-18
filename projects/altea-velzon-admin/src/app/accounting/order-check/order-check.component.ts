import { Component, OnInit } from '@angular/core';
import { Year } from '@syncfusion/ej2-angular-schedule';
import { BranchService, ObjectService, OrderService, SessionService } from 'ng-altea-common';
import { AlteaDb, CheckContactLoyalty, ConsistencyReport, ContactLoyaltyReport, MonthClosing, MonthClosingResult, MonthClosingUpdate, MonthConsistencyReportBuilder } from 'ts-altea-logic';
import { YearMonth } from 'ts-common';
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { DashboardService } from 'ng-common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Branch, ReportMonth, ReportMonths } from 'ts-altea-model';
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
  customReport: SafeHtml

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

  private getClosedYearMonth(): YearMonth {
    let closed = this.branch.acc.closed

    let yearMonth = new YearMonth(closed.year, closed.month)

    return yearMonth
  }

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


  async calculateCustomMonth() {

    console.log('calculateCustomMonth')

    let yearMonth = new YearMonth(2024, 10)

    this.spinner.show()


    let closedYearMonth = this.getClosedYearMonth()

    let monthClosing = new MonthClosing(this.objSvc)
    let branchId = this.sessionSvc.branchId
    this.closeResult = await monthClosing.calculateMonth(branchId, yearMonth, closedYearMonth)

    this.spinner.hide()

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

    me.htmlReport = ''

    let alteaDb = new AlteaDb(this.objSvc)

    let branchId = me.sessionSvc.branchId
    let months = await alteaDb.getReportMonths(branchId)

    let htmlTable = months.toHtmlTable()

    let htmlToShow = htmlTable.toHtmlString()

    me.htmlReport = this.sanitizer.bypassSecurityTrustHtml(htmlToShow)

    console.log(months)

  }

  async getReportMonths() : Promise<ReportMonths> {

    let me = this

    let alteaDb = new AlteaDb(this.objSvc)

    let branchId = me.sessionSvc.branchId

    let from = new YearMonth(2024, 10)
    let to = from.add(2)

    let reportMonths = await alteaDb.getReportMonthsPeriod(branchId, from, to, true)

    return reportMonths
  }

  async showTaxReport() {
    
    let me = this

    me.customReport = ''

    let reportMonths = await this.getReportMonths()

    let htmlTable = reportMonths.taxReport()
    let htmlString = htmlTable.toHtmlString()

    me.customReport = this.sanitizer.bypassSecurityTrustHtml(htmlString)

  }

  async showIncomeReport() {
    
    let me = this

    me.customReport = ''

    let reportMonths = await this.getReportMonths()

    let htmlTable = reportMonths.incomeReport()
    let htmlString = htmlTable.toHtmlString()

    me.customReport = this.sanitizer.bypassSecurityTrustHtml(htmlString)

  }


  async checkContactLoyalty() {

    let me = this

    let alteaDb = new AlteaDb(this.objSvc)

    let report = new ContactLoyaltyReport(alteaDb)


     await report.loadContactData('f3c4cbdd-8ad9-4327-ba08-ce282271ac64')  //checkContact('f3c4cbdd-8ad9-4327-ba08-ce282271ac64')

    let html = report.toHtml()

    me.htmlReport = this.sanitizer.bypassSecurityTrustHtml(html)


  }

}
