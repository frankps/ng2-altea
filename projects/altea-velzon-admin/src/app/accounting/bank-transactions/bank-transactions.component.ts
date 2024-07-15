import { Component, OnInit } from '@angular/core';
import { BankTransactionService } from 'ng-altea-common';
import { DateHelper, DbQuery, QueryOperator } from 'ts-common';
import * as dateFns from 'date-fns'
import { BankTransaction } from 'ts-altea-model';

@Component({
  selector: 'app-bank-transactions',
  templateUrl: './bank-transactions.component.html',
  styleUrls: ['./bank-transactions.component.scss']
})
export class BankTransactionsComponent implements OnInit {

  /** id of bank transaction that is currently in focus */
  txId?: string

  bank = {
    from: new Date(),
    to: new Date()
  }
  /*
  from: Date = new Date()
  to: Date = dateFns.addMonths(this.from, -2)
*/

  txs: BankTransaction[]

  constructor(protected txSvc: BankTransactionService) {

  }

  async ngOnInit() {

    this.initFilters()
    await this.getTransactions()

  }

  initFilters() {

    this.bank.from = dateFns.addMonths(this.bank.to, -2)

  }

  toggleTx(txId: string) {
    if (this.txId == txId)
      this.txId = null
    else
      this.txId = txId
  }

  async getTransactions() {

    const qry = new DbQuery()

    const fromNum = DateHelper.yyyyMMdd(this.bank.from)

    qry.and('refDate', QueryOperator.greaterThan, fromNum)
    qry.orderByDesc('num')

    this.txs = await this.txSvc.query$(qry)

    console.warn(this.txs)

  }



}
