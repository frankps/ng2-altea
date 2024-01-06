import { Injectable } from '@angular/core';
import { ProductOptionValue } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class ProductOptionValueService extends BackendHttpServiceBase<ProductOptionValue> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {

    super(ProductOptionValue, sessionSvc.backend, sessionSvc.branchUnique + '/product-option-values', http)
  }

}