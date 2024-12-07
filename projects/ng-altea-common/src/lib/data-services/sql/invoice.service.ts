import { Injectable } from '@angular/core';
import { Invoice, Template } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService extends BackendHttpServiceBase<Invoice> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {

    super(Invoice, 'Invoice', sessionSvc.backend, sessionSvc.branchUnique + '/invoices', http)
  }


}
