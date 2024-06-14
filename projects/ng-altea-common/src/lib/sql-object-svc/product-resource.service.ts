import { Injectable } from '@angular/core';
import { Product, ProductResource } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../session.service';

@Injectable({
  providedIn: 'root'
})
export class ProductResourceService extends BackendHttpServiceBase<ProductResource> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    /**
     * https://altea-1.ew.r.appspot.com
     * http://192.168.5.202:8080
     * 
     */
    super(ProductResource, 'ProductResource', sessionSvc.backend, sessionSvc.branchUnique + '/product-resources', http)
  }

}