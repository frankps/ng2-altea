import { Injectable } from '@angular/core';
import { LoyaltyCard, Order } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';
import { DbQuery } from 'ts-common';

@Injectable({
  providedIn: 'root'
})
export class LoyaltyCardService extends BackendHttpServiceBase<LoyaltyCard> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(LoyaltyCard, 'LoyaltyCard', sessionSvc.backend, sessionSvc.branchUnique + '/loyalty-cards', http)
  }






}

