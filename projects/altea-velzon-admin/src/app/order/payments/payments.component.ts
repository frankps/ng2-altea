import { Component, OnInit } from '@angular/core';
import { PaymentService } from 'ng-altea-common';
import { Payment, PaymentType } from 'ts-altea-model';
import { ArrayHelper, DateHelper, DbQuery, QueryOperator } from 'ts-common';
import * as _ from "lodash";
import * as dateFns from 'date-fns'

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

  constructor(protected paySvc: PaymentService) {

  }

  async ngOnInit() {




    await this.refreshPayments()

  }

  async dateChange(value: Date) {

    if (!value)
      return

    await this.refreshPayments(value)


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

    const groups: PaymentGroup[] = []


    if (ArrayHelper.IsEmpty(payments))
      return groups

    const allPayments = new PaymentGroup('all', payments)
    groups.push(allPayments)

    const groupBy = _.groupBy(payments, 'type')

    Object.keys(groupBy).forEach(key => {

      const group = new PaymentGroup(key, groupBy[key])



      groups.push(group)

    })


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





}
