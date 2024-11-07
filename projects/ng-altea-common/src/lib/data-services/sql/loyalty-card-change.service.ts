import { Injectable } from '@angular/core';
import { LoyaltyCard, LoyaltyCardChange, Order } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';
import { DbQuery } from 'ts-common';

@Injectable({
  providedIn: 'root'
})
export class LoyaltyCardChangeService extends BackendHttpServiceBase<LoyaltyCardChange> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(LoyaltyCardChange, 'LoyaltyCardChange', sessionSvc.backend, sessionSvc.branchUnique + '/loyalty-card-changes', http)
  }


}
