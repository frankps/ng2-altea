import { Injectable } from '@angular/core';
import { Invoice, Template } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';
import { DbQuery, QueryOperator } from 'ts-common';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService extends BackendHttpServiceBase<Invoice> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {

    super(Invoice, 'Invoice', sessionSvc.backend, sessionSvc.branchUnique + '/invoices', http)
  }

  async getByNum$(branchId: string, invoiceNum: string) : Promise<Invoice> {

    const query = new DbQuery()
    query.include('orders.lines')
    query.take = 1
    query.and('branchId', QueryOperator.equals, branchId)
    query.and('num', QueryOperator.equals, invoiceNum)

    const gift = await this.queryFirst$(query)

    return gift
  }


}
