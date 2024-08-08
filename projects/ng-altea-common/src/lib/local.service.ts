import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';
import { Observable, map, Subject, take } from "rxjs";
import { plainToInstance } from 'class-transformer';
import { Action, ActionType, Event, Job } from 'ts-altea-model';


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

  /**
   * 
   * @param date format yyyymmdd
   * @returns 
   */
  async getEvents$(date: number | string) : Promise<Event[]> {

    let result : any[] = await this.get$(`events/on-date/` + date)

    let events : Event[] = plainToInstance(Event, result)

    return events
  }

  // /for-event/:eventId

  async getJobsForEvent$(eventId: string) : Promise<Job[]> {

    let result : any[] = await this.get$(`jobs/for-event/` + eventId)

    let jobs : Job[] = plainToInstance(Job, result)

    return jobs
  }


  async executeAction$(action: Action): Promise<any> {

    const result = await this.post$(`actions/execute`, action)

    return result

  }


  async runWellness$() : Promise<any> {

    let result : any = await this.get$(`events/runWellness`)

   // let events : Event[] = plainToInstance(Event, result)

    return result
  }

  async runDoorEntry$() : Promise<any> {

    let result : any = await this.get$(`events/runDoorEntry`)

   // let events : Event[] = plainToInstance(Event, result)

    return result
  }




  // events/runWellness

  // http://localhost:3000/events/on-date/20240516

}
