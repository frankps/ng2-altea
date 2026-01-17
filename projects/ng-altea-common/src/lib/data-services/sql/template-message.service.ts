import { Injectable } from '@angular/core';
import { ProductOption, ReportMonth, TemplateMessage } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';


@Injectable({
  providedIn: 'root'
})
export class TemplateMessageService extends BackendHttpServiceBase<TemplateMessage> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(TemplateMessage, 'TemplateMessage', sessionSvc.backend, sessionSvc.branchUnique + '/template-messages', http)
  }

}



/* 
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TemplateMessageService {

  constructor() { }
}
 */