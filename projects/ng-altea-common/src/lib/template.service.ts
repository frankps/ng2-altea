import { Injectable } from '@angular/core';
import { Scheduling, Template } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class TemplateService extends BackendHttpServiceBase<Template> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {

    super(Template, sessionSvc.backend, sessionSvc.branch + '/templates', http)
  }

}

