import { Injectable } from '@angular/core';
import { Contact } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class ContactService extends BackendHttpServiceBase<Contact> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(Contact, sessionSvc.backend, sessionSvc.branch + '/contacts', http)
  }

}

