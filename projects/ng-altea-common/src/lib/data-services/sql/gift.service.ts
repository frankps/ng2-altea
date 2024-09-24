import { Injectable } from '@angular/core';
import { Gift } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';
import { DbQuery, QueryOperator } from 'ts-common';

@Injectable({
  providedIn: 'root'
})
export class GiftService extends BackendHttpServiceBase<Gift> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(Gift, 'Gift', sessionSvc.backend, sessionSvc.branchUnique + '/gifts', http)
  }


  async searchGift(code: string) : Promise<Gift[]> {

    const query = new DbQuery()
    query.take = 10
    query.and('code', QueryOperator.contains, code)

    const gifts = await this.query$(query)

    return gifts
  }


  async getByOrderId$(orderId: string) : Promise<Gift> {

    const query = new DbQuery()
    query.take = 10
    query.and('orderId', QueryOperator.equals, orderId)

    const gift = await this.queryFirst$(query)

    return gift
  }



}

