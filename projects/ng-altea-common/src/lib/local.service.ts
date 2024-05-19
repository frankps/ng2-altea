import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';
import { Observable, map, Subject, take } from "rxjs";
import { plainToInstance } from 'class-transformer';
import { Action, ActionType, Event } from 'ts-altea-model';


export class HttpClientService {

  constructor(protected http: HttpClient, protected httpServer: string) {

  }

  async get$<T>(pageUrl: string): Promise<T> {

    const me = this

    return new Promise<any>(function (resolve, reject) {

      const fullUrl = `${me.httpServer}/${pageUrl}`

      me.http.get(fullUrl).pipe(take(1)).subscribe(res => {
        resolve(res)
      })

    })
  }

  async post$<T>(pageUrl: string, body: any): Promise<T> {

    const me = this

    return new Promise<any>(function (resolve, reject) {

      const fullUrl = `${me.httpServer}/${pageUrl}`

      me.http.post<any>(fullUrl, body).pipe(take(1)).subscribe(res => {
        resolve(res)
      })

    })

  }


}

@Injectable({
  providedIn: 'root'
})
export class LocalService extends HttpClientService {

  constructor(http: HttpClient, protected sessionSvc: SessionService) { 
    super(http, sessionSvc.localServer)
  }

  async getEvents$() : Promise<Event[]> {

    let result : any[] = await this.get$(`events/on-date/20240516`)

    let events : Event[] = plainToInstance(Event, result)

    return events
  }

  async executeAction$(action: Action): Promise<any> {

    const result = await this.post$(`actions/execute`, action)

    return result

  }



  // http://localhost:3000/events/on-date/20240516

}
