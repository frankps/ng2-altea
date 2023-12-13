import { Injectable } from '@angular/core';
import { Scheduling } from 'ts-altea-model'
import { BackendHttpServiceBase } from'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class SchedulingService extends BackendHttpServiceBase<Scheduling> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {

    super(Scheduling, sessionSvc.backend, sessionSvc.branch + '/scheduling', http)
  }

}
