import { Injectable } from '@angular/core';
import { Order } from 'ts-altea-model'
import { HttpClient } from '@angular/common/http';
import { ObjectWithId, BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, ApiBatchResult, DbQuery, ObjectHelper, ApiStatus, ConnectTo } from 'ts-common'
import { plainToInstance } from "class-transformer";
import { Observable, map, Subject, take } from "rxjs";
import { SessionService } from './session.service';
import { HttpClientService } from './http-client.service';
import { AddPaymentToOrderParams } from 'ts-altea-logic';

@Injectable({
  providedIn: 'root'
})
export class OrderMgrService extends HttpClientService {

  /*
  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(http, sessionSvc.localServer)
  }*/


  urlDifferentiator = 'order-mgr'

  constructor(http: HttpClient, protected sessionSvc: SessionService) { 
    super(http, sessionSvc.backend)
  }


  getPossibleDates(order: Order) {

    console.warn('Calling: getPossibleDates', order)

    const observ = this.http.put<any>(`${this.sessionSvc.backend}/${this.sessionSvc.branchUnique}/${this.urlDifferentiator}/get-possible-dates`, order).pipe(map(res => {

      console.warn('Get possible dates', res)

      if (res && res.status === ApiStatus.ok) {
        console.warn('Get possible dates returned !')
      }

      return res
    })).subscribe(res => {
      console.warn(res)
    })
  }



  //@Post('addPaymentToOrder')
  async addPaymentToOrder(params: AddPaymentToOrderParams): Promise<ApiResult<Order>> {

    var res = await this.post$(`${this.sessionSvc.branchUnique}/order-mgr/addPaymentToOrder`, params)

    if (res) {
      const apiResult = plainToInstance(ApiResult, res)
      return apiResult
    }
     
    return null
  }


}
