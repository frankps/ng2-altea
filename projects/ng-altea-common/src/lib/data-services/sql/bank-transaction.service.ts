import { Injectable } from '@angular/core';
import { BankTransaction, Contact } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';

@Injectable({
  providedIn: 'root'
})
export class BankTransactionService extends BackendHttpServiceBase<BankTransaction> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(BankTransaction, 'BankTransaction', sessionSvc.backend, sessionSvc.branchUnique + '/bank-transactions', http)
  }
}
