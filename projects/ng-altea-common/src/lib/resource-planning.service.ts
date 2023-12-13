import { Injectable } from '@angular/core';
import { Product, ProductResource, ResourcePlanning } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class ResourcePlanningService extends BackendHttpServiceBase<ResourcePlanning> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    /**
     * https://altea-1.ew.r.appspot.com
     * http://192.168.5.202:8080
     * 
     */
    super(ResourcePlanning, sessionSvc.backend, sessionSvc.branch + '/resource-plannings', http)
  }

}