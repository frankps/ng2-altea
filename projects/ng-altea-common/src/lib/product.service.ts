import { Injectable } from '@angular/core';
import { Product, ProductType } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';
import { DbQuery, QueryOperator } from 'ts-common';
import { Observable, map, Subject, take } from "rxjs";


@Injectable({
  providedIn: 'root'
})
export class ProductService extends BackendHttpServiceBase<Product> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    /**
     * https://altea-1.ew.r.appspot.com
     * http://192.168.5.202:8080
     * 
     * 
     */
    super(Product, sessionSvc.backend, sessionSvc.branchUnique + '/products', http)
  }



  getAllCategories(type: ProductType, categoryId: string | null = null): Observable<Product[]> {

    const query = new DbQuery()
    query.and('type', QueryOperator.equals, type)
    query.and('isCategory', QueryOperator.equals, true)
    query.and('deleted', QueryOperator.equals, false)
    query.and('catId', QueryOperator.equals, categoryId)
    query.take = 200
    query.select('id', 'catId', 'name', 'type')

    return this.query(query).pipe(map(obj => obj.data ? obj.data : []))
  }

  getProductsInCategory(categoryId: string): Observable<Product[]> {
    const query = new DbQuery()
    // query.and('type', QueryOperator.equals, type)
    // query.and('isCategory', QueryOperator.equals, true)
    query.and('deleted', QueryOperator.equals, false)
    query.and('catId', QueryOperator.equals, categoryId)
    query.include('options:orderBy=idx.values:orderBy=idx')
    query.take = 200
  //  query.select('id', 'catId', 'name', 'type', 'isCategory')

    return this.query(query).pipe(map(obj => obj.data ? obj.data : []))
  }



}
