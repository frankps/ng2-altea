import { Injectable } from '@angular/core';
import { Gift } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class GiftService extends BackendHttpServiceBase<Gift> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(Gift, sessionSvc.backend, sessionSvc.branch + '/gifts', http)
  }

}

