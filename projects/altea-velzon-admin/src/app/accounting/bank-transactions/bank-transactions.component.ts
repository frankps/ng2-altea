import { Component, OnInit } from '@angular/core';
import { BankTransactionService, ObjectService, PaymentService } from 'ng-altea-common';
import { ArrayHelper, DateHelper, DbQuery, QueryOperator } from 'ts-common';
import * as dateFns from 'date-fns'
import { BankTransaction, BankTxType, Payment, PaymentType } from 'ts-altea-model';
import { FortisBankImport } from 'ts-altea-logic';
import * as _ from "lodash";

@Component({
  selector: 'app-bank-transactions',
  templateUrl: './bank-transactions.component.html',
  styleUrls: ['./bank-transactions.component.scss']
})
export class BankTransactionsComponent implements OnInit {



  bank = {
    from: new Date(),
    to: new Date(),
    search: null
  }
  /*
  from: Date = new Date()
  to: Date = dateFns.addMonths(this.from, -2)
*/

  txs: BankTransaction[]

  /** id of bank transaction that is currently in focus */
  txId?: string

  /** payments for current transaction */
  pays: Payment[]

  payments = {
    total: 0,
    linked: 0
  }

  constructor(protected txSvc: BankTransactionService, protected paySvc: PaymentService, protected objSvc: ObjectService) {

  }

  async ngOnInit() {

    this.initFilters()
    await this.getTransactions()

  }

  initFilters() {

    this.bank.from = dateFns.addMonths(this.bank.to, -2)

  }

  toggleTx(tx: BankTransaction) {

    tx['open'] = !tx['open']

  }

  async getTransactions() {

    const qry = new DbQuery()

    const fromNum = DateHelper.yyyyMMdd(this.bank.from)
    const toNum = DateHelper.yyyyMMdd(this.bank.to)

    qry.and('execDate', QueryOperator.greaterThanOrEqual, fromNum)
    qry.and('execDate', QueryOperator.lessThanOrEqual, toNum)

    if (this.bank.search)
      qry.and('details', QueryOperator.contains, this.bank.search)

    qry.orderByDesc('num')

    console.warn(qry)

    this.txs = await this.txSvc.query$(qry)

    console.warn(this.txs)

  }



  async findPaymentsForTx(tx: BankTransaction, extraDays: number = 0) {

    console.log(`findPaymentsForTx`, tx)

    this.txId = tx.id 
    this.pays = []

    const fortis = new FortisBankImport(this.objSvc)

    const txInfo = fortis.getBankTransactionInfo(tx)

    const forDate = txInfo.forDateTime()

    let fromDate = dateFns.startOfDay(forDate)
    let toDate = dateFns.endOfDay(forDate)

    if (extraDays > 0) {
      fromDate = dateFns.addDays(fromDate, - extraDays)
      toDate = dateFns.addDays(toDate, extraDays)
    }

    console.warn(txInfo)

    const qry = new DbQuery()

    qry.include('order')
    qry.and('date', QueryOperator.greaterThanOrEqual, DateHelper.yyyyMMddhhmmss(fromDate))
    qry.and('date', QueryOperator.lessThanOrEqual, DateHelper.yyyyMMddhhmmss(toDate))

    const payTypes = [PaymentType.credit, PaymentType.debit]
    qry.and('type', QueryOperator.in, payTypes)

    /*     qry.and('type', QueryOperator.equals, PaymentType.debit) */

    /*
    switch (tx.type) {
      case BankTxType.onlineBC:
      case BankTxType.onlineCredit:
      case BankTxType.onlineBC:

    } */

    this.pays = await this.paySvc.query$(qry)

    this.showTotals(this.pays, tx)

    console.warn(this.pays)

  }

  showTotals(pays: Payment[], tx: BankTransaction) {

    this.payments.total = 0
    this.payments.linked = 0

    if (ArrayHelper.IsEmpty(pays)) 
      return

    this.payments.total = _.sumBy(pays, 'amount')

    if (tx?.id) {
      let paysForTx = pays.filter(p => p.bankTxId == tx.id)
      this.payments.linked = _.sumBy(paysForTx, 'amount')

    }


  }



}


