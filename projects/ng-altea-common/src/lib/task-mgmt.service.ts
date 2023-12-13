import { Injectable } from '@angular/core';
import { Task, TaskMgmt } from 'ts-altea-model'
import { BackendHttpServiceBase } from'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class TaskMgmtService extends BackendHttpServiceBase<TaskMgmt> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(TaskMgmt, sessionSvc.backend, sessionSvc.branch + '/task-mgmt', http)
  }

}
