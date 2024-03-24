import { Injectable } from '@angular/core';
import { Price } from 'ts-altea-model'
import { BackendHttpServiceBase } from'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class PriceService extends BackendHttpServiceBase<Price> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(Price, 'Price', sessionSvc.backend, sessionSvc.branchUnique + '/prices', http)
  }

}
