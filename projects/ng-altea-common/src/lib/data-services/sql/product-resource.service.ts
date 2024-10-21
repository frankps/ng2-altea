import { Injectable } from '@angular/core';
import { Product, ProductResource } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';
import { ResourceService } from 'ng-altea-common';
import * as _ from "lodash";

@Injectable({
  providedIn: 'root'
})
export class ProductResourceService extends BackendHttpServiceBase<ProductResource> {

  constructor(http: HttpClient, protected sessionSvc: SessionService, protected resourceSvc: ResourceService) {
    /**
     * https://altea-1.ew.r.appspot.com
     * http://192.168.5.202:8080
     * 
     */
    super(ProductResource, 'ProductResource', sessionSvc.backend, sessionSvc.branchUnique + '/product-resources', http)
  }


  async attachResourcesToProducts(prods: Product[]) : Promise<boolean> {

    let ok = true

    for (let prod of prods) {
      let res = this.attachResourcesToProduct(prod)

      if (!res)
        ok = false
    }

    return ok
  }


  async attachResourcesToProduct(prod: Product) : Promise<boolean> {

    let me = this

    let resourceIds = prod.resources.map(pr => pr.resourceId)
    resourceIds = _.uniq(resourceIds)

    let resources = await me.resourceSvc.getMany$(resourceIds)

    let ok = prod.attachResources(resources)

    return ok
  }



}