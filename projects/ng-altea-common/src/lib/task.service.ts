import { Injectable } from '@angular/core';
import { Task } from 'ts-altea-model'
import { BackendHttpServiceBase } from'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService extends BackendHttpServiceBase<Task> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(Task, sessionSvc.backend, sessionSvc.branchUnique + '/tasks', http, `branches/${sessionSvc.branchUnique}/updates/task`)
  }

  // 'branches/aqua/updates/task'

}
