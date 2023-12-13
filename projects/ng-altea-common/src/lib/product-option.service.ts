import { Injectable } from '@angular/core';
import { ProductOption } from 'ts-altea-model'
import { BackendHttpServiceBase } from'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class ProductOptionService extends BackendHttpServiceBase<ProductOption> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {

    super(ProductOption, sessionSvc.backend, sessionSvc.branch + '/product-options', http)
  }

}



/*

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProductOptionService {

  constructor() { }
}

*/

