import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';
import { Observable, map, Subject, take } from "rxjs";
import { plainToInstance } from 'class-transformer';
import { Action, ActionType, Event, Job } from 'ts-altea-model';
import { ApiListResult, ApiResult } from 'ts-common';
import { HttpClientService } from './http-client.service';




@Injectable({
  providedIn: 'root'
})
export class LocalService extends HttpClientService {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(http, sessionSvc.localServer)
  }

  async getDoorAccessUsers$(): Promise<any> {

    let result: any = await this.get$(`door-access/users`)

    return result
  }


  async deleteDoorAccessUsers$(uuids: string[]): Promise<any> {

    let result: any = await this.post$(`door-access/delete-users`, uuids)

    return result
  }



  /**
   * 
   * @param date format yyyymmdd
   * @returns 
   */
  async getEvents$(date: number | string): Promise<Event[]> {

    let result: any[] = await this.get$(`events/on-date/` + date)

    let events: Event[] = plainToInstance(Event, result)

    return events
  }

  async deleteAllEvents$(): Promise<any> {

    let result: any[] = await this.delete$(`events/all`)

    return result
  }

  async truncateAllEvents$(): Promise<any> {

    let result: any[] = await this.delete$(`events/truncate`)

    return result
  }

  // /for-event/:eventId

  async getJobsForEvent$(eventId: string): Promise<Job[]> {

    let result: any[] = await this.get$(`jobs/for-event/` + eventId)

    let jobs: Job[] = plainToInstance(Job, result)

    return jobs
  }


  async executeAction$(action: Action): Promise<ApiListResult<any>> {

    let result = await this.post$(`actions/execute`, action)

    return plainToInstance(ApiListResult<any>, result)

  }


  async runWellness$(): Promise<any> {

    let result: any = await this.get$(`events/runWellness`)

    // let events : Event[] = plainToInstance(Event, result)

    return result
  }

  async runDoorEntry$(): Promise<any> {

    let result: any = await this.get$(`events/runDoorEntry`)

    console.warn(result)

    // let events : Event[] = plainToInstance(Event, result)

    return result
  }



  async dialogflowWebhookRequest(): Promise<any> {



  }


  // events/runWellness

  // http://localhost:3000/events/on-date/20240516

}
