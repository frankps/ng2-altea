import { Injectable } from '@angular/core';
import { Product, Resource } from 'ts-altea-model'
import { BackendHttpServiceBase } from'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class ResourceService extends BackendHttpServiceBase<Resource> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(Resource, sessionSvc.backend, sessionSvc.branch + '/resources', http)
  }

}

