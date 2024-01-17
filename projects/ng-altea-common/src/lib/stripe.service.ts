import { Injectable } from '@angular/core';
import { CreateCheckoutSession, Message, Order } from 'ts-altea-model';
import { plainToInstance } from "class-transformer";
import { Observable, map, Subject, take } from "rxjs";
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';

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


  createCheckoutSession(checkout: CreateCheckoutSession): Observable<any> {

    return this.http.post<any>(`${this.sessionSvc.backend}/stripe/createCheckoutSession`, checkout).pipe(map(session => {

      console.error(session)

      return session
    }
    ))
  }

  async createCheckoutSession$(checkout: CreateCheckoutSession): Promise<any> {

    return this.post$(this.sessionSvc.backend, 'stripe/createCheckoutSession', checkout)
    /*
    const me = this

    return new Promise<any>(function (resolve, reject) {

      me.createCheckoutSession(checkout).pipe(take(1)).subscribe(res => {
        resolve(res)
      })

    }) */

  }

}
