import { Injectable } from '@angular/core';
import { Gift, Payment } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';
import { DbQuery, QueryOperator } from 'ts-common';

@Injectable({
  providedIn: 'root'
})
export class PaymentService extends BackendHttpServiceBase<Payment> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(Payment, 'Payment', sessionSvc.backend, sessionSvc.branchUnique + '/payments', http)
  }

}



