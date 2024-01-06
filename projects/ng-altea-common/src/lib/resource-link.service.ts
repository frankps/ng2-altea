import { Injectable } from '@angular/core';
import { Product, Resource, ResourceLink } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class ResourceLinkService extends BackendHttpServiceBase<ResourceLink> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    /**
     * https://altea-1.ew.r.appspot.com
     * http://192.168.5.202:8080
     * 
     * 
     */
    super(ResourceLink, sessionSvc.backend, sessionSvc.branchUnique + '/resource-links', http)
  }

}




/*
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ResourceLinkService {

  constructor() { }
}
*/