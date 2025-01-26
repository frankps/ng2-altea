import { Component, OnInit } from '@angular/core';
import { PaymentService, SessionService } from 'ng-altea-common';
import { Payment, PaymentType } from 'ts-altea-model';
import { ArrayHelper, DateHelper, DbQuery, QueryOperator, Translation } from 'ts-common';
import * as _ from "lodash";
import * as dateFns from 'date-fns'
import { TranslationService } from 'ng-common'
import { DashboardService, ToastType } from 'ng-common'

export class PaymentGroup {

  name: string

  total: number

  payments: Payment[] = []

  constructor(name?: string, payments: Payment[] = []) {

    this.name = name
    this.payments = payments

    this.setTotal()
  }

  setTotal() {

    if (ArrayHelper.IsEmpty(this.payments)) {
      this.total = 0
      return
    }

    let total = _.sumBy(this.payments, 'amount')
    this.total = Math.round(total * 100) / 100
  }

}

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss']
})
export class PaymentsComponent implements OnInit {

  /** current selected payment id */
  payId: string


  payments: Payment[]

  visible: Payment[]

  paymentsByType: PaymentGroup[]

  // curr
  group: PaymentGroup

  dateRange: Date[] = []

  date: Date

  paymentTypes: Translation[] = []

  init = false

  accountingFrozenUntil: Date

  constructor(protected paySvc: PaymentService, private translationSvc: TranslationService, public dashboardSvc: DashboardService, public sessionSvc: SessionService) {

  }

  async ngOnInit() {

    let branch = await this.sessionSvc.branch$()
    this.accountingFrozenUntil = branch.accountingClosedUntil()

    await this.translationSvc.translateEnum(PaymentType, 'enums.pay-type.', this.paymentTypes)



    await this.refreshPayments()

    this.init = true
  }

  async dateChange(value: Date) {

    if (!value)
      return

    await this.refreshPayments(value)


  }


  canEditPayment(pay: Payment) {

    if (pay.bankTxId)
      return false


    let payDate = pay.dateTyped
    if (payDate && payDate < this.accountingFrozenUntil)
      return false
    
    return true
  }

  async savePayment(payment: Payment) {

    if (!payment)
      return

    let update = {
      id: payment.id,
      type: payment.type,
      amount: payment.amount,
      provId: payment.provId,
      date: payment.date
    }


    let updateRes = await this.paySvc.update$(update)
    console.log(updateRes)

    if (updateRes.isOk) {
      this.paymentsByType = this.makeGroups(this.payments)
      this.payId = null
      this.dashboardSvc.showToastType(ToastType.saveSuccess)
    } else
      this.dashboardSvc.showToastType(ToastType.saveError)


  }

  async deletePayment(payment: Payment) {


    var res = await this.paySvc.delete$(payment.id)

    console.log(res)

  }


  async refreshPayments(date: Date = null) {

    if (!date)
      date = new Date()

    const fromDate = dateFns.startOfDay(date)
    const toDate = dateFns.endOfDay(date)

    const from = DateHelper.yyyyMMddhhmmss(fromDate) //20240901000000
    const to = DateHelper.yyyyMMddhhmmss(toDate) //20240910000000

    this.payments = await this.getPayments(from, to)
    this.visible = this.payments
    this.paymentsByType = this.makeGroups(this.payments)

    console.log(this.paymentsByType)
  }

  togglePayment(payment: Payment) {

    console.log(payment)
    if (payment.id != this.payId)
      this.payId = payment.id
    else
      this.payId = null

  }

  showGroup(group: PaymentGroup) {

    this.group = group
    this.payments = group.payments

  }


  makeGroups(payments: Payment[]): PaymentGroup[] {

    let groups: PaymentGroup[] = []


    if (ArrayHelper.IsEmpty(payments))
      return groups

    const allPayments = new PaymentGroup('all', payments)
    groups.push(allPayments)

    const groupBy = _.groupBy(payments, 'type')

    Object.keys(groupBy).forEach(key => {

      const group = new PaymentGroup(key, groupBy[key])

      groups.push(group)

    })

    groups = _.orderBy(groups, ['name', 'asc'])

    console.error(groups)

    return groups

  }

  async getPayments(from: number, to: number) {

    const query = new DbQuery()

    query.and('date', QueryOperator.greaterThanOrEqual, from)
    query.and('date', QueryOperator.lessThan, to)

    query.include('order')


    query.orderBy('date')

    const payments = await this.paySvc.query$(query)

    console.log(payments)

    return payments

  }

  /**
   * To identify payments that are not linked
   */
  async getUnlinkedBankPayments(date: Date) {

    if (!date)
      date = new Date()

    console.log(date)

    const fromDate = dateFns.startOfMonth(date)
    const toDate = dateFns.endOfMonth(date)

    const from = DateHelper.yyyyMMddhhmmss(fromDate) //20240901000000
    const to = DateHelper.yyyyMMddhhmmss(toDate) //20240910000000


    const query = new DbQuery()

    query.and('date', QueryOperator.greaterThanOrEqual, from)
    query.and('date', QueryOperator.lessThan, to)
    query.and('type', QueryOperator.in, [PaymentType.credit, PaymentType.debit, PaymentType.stripe, PaymentType.transfer])
    query.and('bankTxId', QueryOperator.equals, null)

    query.include('order')

    query.orderBy('date')

    const payments = await this.paySvc.query$(query)

    console.log(payments)

    
    this.payments = payments
    this.paymentsByType = this.makeGroups(payments)

    return payments

  }





}
