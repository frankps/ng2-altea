import { Injectable } from '@angular/core';
import { Order } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';
import { DbQuery } from 'ts-common';

@Injectable({
  providedIn: 'root'
})
export class OrderService extends BackendHttpServiceBase<Order> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(Order, sessionSvc.backend, sessionSvc.branchUnique + '/orders', http)
  }






}

