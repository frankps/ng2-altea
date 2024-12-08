import { Injectable } from '@angular/core';
import { Branch, Contact, Organisation } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';
import { DbQuery } from 'ts-common';

@Injectable({
  providedIn: 'root'
})
export class OrganisationService extends BackendHttpServiceBase<Organisation> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(Organisation, 'Organisation', sessionSvc.backend, 'organisation', http)
  }


}
