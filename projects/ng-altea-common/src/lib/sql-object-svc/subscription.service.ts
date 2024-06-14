import { Injectable } from '@angular/core';
import { Subscription } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../session.service';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService extends BackendHttpServiceBase<Subscription> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(Subscription, 'Subscription', sessionSvc.backend, sessionSvc.branchUnique + '/subscriptions', http)
  }

}
