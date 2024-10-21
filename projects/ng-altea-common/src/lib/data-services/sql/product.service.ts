import { Injectable } from '@angular/core';
import { OnlineMode, Product, ProductSubType, ProductType } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';
import { DbQuery, QueryOperator } from 'ts-common';
import { Observable, map, Subject, take } from "rxjs";
import { ProductResourceService } from 'ng-altea-common';


@Injectable({
  providedIn: 'root'
})
export class ProductService extends BackendHttpServiceBase<Product> {

  constructor(http: HttpClient, protected sessionSvc: SessionService, protected prodResSvc: ProductResourceService) {
    /**
     * https://altea-1.ew.r.appspot.com
     * http://192.168.5.202:8080
     * 
     * 
     */
    super(Product, 'Product', sessionSvc.backend, sessionSvc.branchUnique + '/products', http)

    this.softDelete = true
  }  


  /*
options:orderBy=idx.values:orderBy=idx
options:orderBy=idx.values:orderBy=idx,resources.resource
options:orderBy=idx.values:orderBy=idx', 'resources.resource', 'items'
options:orderBy=idx.values:orderBy=idx
  */



  override async get$(id: string, includes?: string | string[] | null): Promise<Product> {

    let me = this

    let product = await super.get$(id, includes)

    if (this.caching) {
      // we only need to do this in case of caching, because resources are NOT cached inside products
      await me.prodResSvc.attachResourcesToProduct(product)
    }

    return product


  }



  getCategories(type?: ProductType, categoryId: string | null = null): Observable<Product[]> {
    const query = this.getCategoriesQuery(type, categoryId)
    return this.query(query).pipe(map(obj => obj.data ? obj.data : []))
  }

  /**
   * 
   * @param type 
   * @param categoryId if 'any', then we search categoryId independent
   * @returns 
   */
  getCategories$(type?: ProductType, categoryId: 'any' | string | null = 'any'): Promise<Product[]> {
    const query = this.getCategoriesQuery(type, categoryId)
    return this.query$(query)
  }


  getCategoriesQuery(type?: ProductType, categoryId: 'any' | string | null = null): DbQuery {

    const query = new DbQuery()

    if (type)
      query.and('type', QueryOperator.equals, type)

    query.and('sub', QueryOperator.equals, ProductSubType.cat)
    query.and('del', QueryOperator.equals, false)

    if (categoryId != 'any')
      query.and('catId', QueryOperator.equals, categoryId)

    query.and('online', QueryOperator.not, OnlineMode.invisible)
    query.take = 200
    query.select('id', 'catId', 'name', 'type', 'sub')

    return query
  }


  getProductsInCategoryQuery(categoryId: string | null = null): DbQuery {
    const query = new DbQuery()

    query.and('del', QueryOperator.equals, false)
    query.and('catId', QueryOperator.equals, categoryId)
    query.and('online', QueryOperator.not, OnlineMode.invisible)

    //productQry.include('options:orderBy=idx.values:orderBy=idx', 'resources:orderBy=idx.resource', 'items:orderBy=idx', 'prices')

    query.include('options:orderBy=idx.values:orderBy=idx', 'items:orderBy=idx')
    // query.include('options:orderBy=idx.values:orderBy=idx', 'resources:orderBy=idx.resource', 'items:orderBy=idx', 'prices')
    query.take = 200

    return query
  }

  getProductsInCategory$(categoryId: string | null = null): Promise<Product[]> {

    const query = this.getProductsInCategoryQuery(categoryId)

    return this.query$(query)
  }

  getProductsInCategory(categoryId: string | null = null): Observable<Product[]> {

    const query = this.getProductsInCategoryQuery(categoryId)

    return this.query(query).pipe(map(obj => obj.data ? obj.data : []))
  }



  // 'prices,options:orderBy=idx.values:orderBy=idx,items:orderBy=idx,resources:orderBy=idx.resource'


  async getAllProductsForExport(): Promise<Product[]> {

    const query = new DbQuery()
    query.includes = 'prices,options:orderBy=idx.values:orderBy=idx,items:orderBy=idx,resources:orderBy=idx.resource'.split(',')
    query.take = 1000

    const products = await this.query$(query)

    return products
  }



}
