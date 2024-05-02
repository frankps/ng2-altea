import { Injectable } from '@angular/core';
import { LoyaltyProgram, Order } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';
import { DbQuery } from 'ts-common';

@Injectable({
  providedIn: 'root'
})
export class LoyaltyProgramService extends BackendHttpServiceBase<LoyaltyProgram> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(LoyaltyProgram, 'LoyaltyProgram', sessionSvc.backend, sessionSvc.branchUnique + '/loyalty-programs', http)
  }






}
