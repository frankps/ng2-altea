import { Injectable } from '@angular/core';
import { RecurringTask } from 'ts-altea-model'
import { BackendHttpServiceBase } from'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class RecurringTaskService extends BackendHttpServiceBase<RecurringTask> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(RecurringTask, sessionSvc.backend, sessionSvc.branchUnique + '/recurring-tasks', http)
  }

}
