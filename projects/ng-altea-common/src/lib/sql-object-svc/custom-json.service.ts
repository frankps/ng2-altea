import { Injectable } from '@angular/core';
import { CustomJson } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../session.service';

@Injectable({
  providedIn: 'root'
})
export class CustomJsonService extends BackendHttpServiceBase<CustomJson> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(CustomJson, 'CustomJson', sessionSvc.backend, 'custom-json', http)
  }
}
