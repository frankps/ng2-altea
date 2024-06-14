import { Injectable } from '@angular/core';
import { ProductItem } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../session.service';

@Injectable({
  providedIn: 'root'
})
export class ProductItemService extends BackendHttpServiceBase<ProductItem> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {

    super(ProductItem, 'ProductItem', sessionSvc.backend, sessionSvc.branchUnique + '/product-items', http)
  }

}


/*


import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProductItemService {

  constructor() { }
}
*/