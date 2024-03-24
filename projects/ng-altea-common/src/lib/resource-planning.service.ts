import { Injectable } from '@angular/core';
import { Product, ProductResource, ResourcePlanning } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';
import { DbQuery, QueryOperator } from 'ts-common';

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
    super(ResourcePlanning, 'ResourcePlanning', sessionSvc.backend, sessionSvc.branchUnique + '/resource-plannings', http)
  }





}