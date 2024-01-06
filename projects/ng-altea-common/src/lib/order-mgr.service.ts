import { Injectable } from '@angular/core';
import { Order } from 'ts-altea-model'
import { HttpClient } from '@angular/common/http';
import { ObjectWithId, BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, ApiBatchResult, DbQuery, ObjectHelper, ApiStatus, ConnectTo } from 'ts-common'
import { plainToInstance } from "class-transformer";
import { Observable, map, Subject, take } from "rxjs";
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class OrderMgrService {

  urlDifferentiator = 'order-mgr'

  constructor(protected http: HttpClient, protected sessionSvc: SessionService) { }


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

}
