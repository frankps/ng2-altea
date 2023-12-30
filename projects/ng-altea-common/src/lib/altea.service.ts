import { Injectable } from '@angular/core';
import { AlteaDb, AvailabilityService, OrderMgmtService } from 'ts-altea-logic';
import { ObjectService } from './object.service';
import { SessionService } from './session.service';
import { SubscriptionMgmtService } from 'projects/ts-altea-logic/src/lib/subscription/subscription-mgmt-service';

@Injectable({
  providedIn: 'root'
})
export class AlteaService {

  db: AlteaDb

  constructor(private objSvc: ObjectService, private sessionSvc: SessionService) {

    this.db = new AlteaDb(objSvc, this.sessionSvc.branchId)

  }


  _availabilityService?: AvailabilityService

  get availabilityService(): AvailabilityService {

    if (!this._availabilityService)
      this._availabilityService = new AvailabilityService(this.objSvc)

    return this._availabilityService
  }


  _orderMgmtService?: OrderMgmtService

  get orderMgmtService(): OrderMgmtService {

    if (!this._orderMgmtService)
      this._orderMgmtService = new OrderMgmtService(this.objSvc)

    return this._orderMgmtService
  }


  _subscriptionMgmtService?: SubscriptionMgmtService

  get subscriptionMgmtService(): SubscriptionMgmtService {

    if (!this._subscriptionMgmtService)
      this._subscriptionMgmtService = new SubscriptionMgmtService(this.objSvc)

    return this._subscriptionMgmtService
  }


}
