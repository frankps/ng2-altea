import { Injectable } from '@angular/core';
import { CreateCheckoutSession, Message, Order, StripeGetPayouts, StripePayout, StripeSessionStatus } from 'ts-altea-model';
import { instanceToPlain, plainToInstance } from "class-transformer";
import { Observable, map, Subject, take } from "rxjs";
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';
import { ApiListResult, ApiResult, ArrayHelper } from 'ts-common';

@Injectable({
  providedIn: 'root'
})
export class StripeService {

  constructor(protected http: HttpClient, protected sessionSvc: SessionService) { }

  async post$<T>(httpServer: string, pageUrl: string, body: any): Promise<T> {

    const me = this

    return new Promise<any>(function (resolve, reject) {

      const fullUrl = `${httpServer}/${pageUrl}`

      me.http.post<any>(fullUrl, body).pipe(take(1)).subscribe(res => {
        resolve(res)
      })

    })

  }

  async get$<T>(httpServer: string, pageUrl: string): Promise<T> {

    const me = this

    return new Promise<any>(function (resolve, reject) {

      const fullUrl = `${httpServer}/${pageUrl}`

      me.http.get<any>(fullUrl).pipe(take(1)).subscribe(res => {
        resolve(res)
      })
    })
  }

  async webhookTest(event: any): Promise<any> {
    return this.post$(this.sessionSvc.backend, `stripe/webhook`, event)
  }


  // http://localhost:4300/branch/aqua/pay-finished?orderId=123&sessionId=cs_test_a1U1IuChwqT96gB86qVtIhznLrFQ7nE07GZ95cYWRqkKQd8fMYVSAsYB1x%27
  async sessionStatus(environment: 'test' | 'live', sessionId: string): Promise<ApiResult<StripeSessionStatus>> {
    const res: ApiResult<StripeSessionStatus> = await this.get$(this.sessionSvc.backend, `stripe/sessionStatus/${environment}/${sessionId}`)

    const result = plainToInstance(ApiResult<StripeSessionStatus>, res)

    console.warn(result)

    result.object = plainToInstance(StripeSessionStatus, res.object)

    return result
  }



  /*   async sessionStatus(sessionId: string): Promise<any> {
      return this.post$(this.sessionSvc.backend, `stripe/sessionStatus`, { sessionId: sessionId})
    } */


  async createCheckoutSession$(checkout: CreateCheckoutSession): Promise<any> {

    return this.post$(this.sessionSvc.backend, 'stripe/createCheckoutSession', checkout)

  }


  async getPayouts$(filter: StripeGetPayouts): Promise<StripePayout[]> {

    let result: ApiListResult<any> = await this.post$(this.sessionSvc.backend, 'stripe/getPayouts', filter)


    if (result?.status == 'ok' && ArrayHelper.NotEmpty(result?.data)) {

      let payouts = plainToInstance(StripePayout, result?.data)
      return payouts

    }

    return []
  }

  async getPayout$(id: string): Promise<any> {

    let result: ApiResult<any> = await this.get$(this.sessionSvc.backend, `stripe/getPayout/${id}`)

    if (result?.status == 'ok' && result.object)
      return result.object
    else
      return null
  }

}
