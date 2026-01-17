/* eslint-disable @typescript-eslint/no-this-alias */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ObjectWithId, BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, ApiBatchResult, DbQuery, ObjectHelper, ApiStatus, ConnectTo, DbQueryTyped, DbObjectCreate, DbObjectMulti, DbObject, DbObjectMultiCreate, DbQueryBaseTyped, DbUpdateManyWhere, DeleteManyResult, PrismaNativeQuery, ArrayHelper } from 'ts-common'
import { plainToInstance } from "class-transformer";
import { Observable, map, Subject, take } from "rxjs";
import { SessionService } from './session.service';
import { IDb } from 'ts-altea-logic';
import { CreateCheckoutSession, Message, Order, Product } from 'ts-altea-model';
import { BackendHttpServiceBase } from 'ng-common';
import { ProductResourceService } from 'ng-altea-common';


@Injectable({
  providedIn: 'root'
})
export class ObjectService implements IDb {

  typeCaches = new Map<any, BackendHttpServiceBase<any>>()


  constructor(protected http: HttpClient, protected sessionSvc: SessionService, protected prodResSvc: ProductResourceService) { }


  async post$<T>(httpServer: string, pageUrl: string, body: any): Promise<T> {

    const me = this

    return new Promise<any>(function (resolve, reject) {

      const fullUrl = `${httpServer}/${pageUrl}`

      me.http.post<any>(fullUrl, body).pipe(take(1)).subscribe(res => {
        resolve(res)
      })

    })

  }

  async put$<T>(httpServer: string, pageUrl: string, body: any): Promise<T> {

    const me = this

    return new Promise<any>(function (resolve, reject) {

      const fullUrl = `${httpServer}/${pageUrl}`

      me.http.put<any>(fullUrl, body).pipe(take(1)).subscribe(res => {
        resolve(res)
      })

    })

  }

  async delete$<T>(httpServer: string, pageUrl: string, body: any): Promise<T> {

    const me = this

    return new Promise<any>(function (resolve, reject) {

      const fullUrl = `${httpServer}/${pageUrl}`

      me.http.delete<any>(fullUrl, body).pipe(take(1)).subscribe(res => {
        resolve(res)
      })

    })

  }





  update<Out>(dbObject: DbObject<Out>): Observable<ApiResult<Out>> {

    return this.http.put<ApiResult<Out>>(`${this.sessionSvc.backend}/${this.sessionSvc.branchUnique}/objects/update`, dbObject).pipe(map(res => {

      let typedRes: ApiResult<Out> = plainToInstance(ApiResult<Out>, res)

      if (res && res.object) {

        typedRes.object = plainToInstance(dbObject.type, res.object)
      }

      return typedRes

    }
    ))
  }

  // update$<Inp, Out>(dbObject: DbObject<Inp, Out>): Promise<ApiResult<Out>>

  //  async update$<T extends ObjectWithId>(dbObject: DbObjectCreate<T>): Promise<ApiResult<T>> {

  async update$<Inp, Out>(dbObject: DbObject<Out>): Promise<ApiResult<Out>> {
    const me = this

    return new Promise<ApiResult<Out>>(function (resolve, reject) {

      me.update<Out>(dbObject).pipe(take(1)).subscribe(res => {
        resolve(res)
      })

    })

  }


  async updateMany$<Inp, Out>(dbObject: DbObjectMulti<Inp, Out>): Promise<ApiListResult<Out>> {

    let res = await this.put$(this.sessionSvc.backend, `${this.sessionSvc.branchUnique}/objects/updateMany`, dbObject)

    let typedRes: ApiListResult<Out> = plainToInstance(ApiListResult<Out>, res)

    typedRes.data = plainToInstance(dbObject.type, typedRes.data)

    return typedRes
  }

  async updateManyWhere$<T extends ObjectWithId>(update: DbUpdateManyWhere<T>): Promise<any> {

    let res = await this.put$(this.sessionSvc.backend, `${this.sessionSvc.branchUnique}/objects/updateManyWhere`, update)

    return res

  }


  async deleteMany$<T extends ObjectWithId>(query: DbQueryBaseTyped<T>): Promise<ApiResult<DeleteManyResult>> {

    let res = await this.post$(this.sessionSvc.backend, `${this.sessionSvc.branchUnique}/objects/deleteMany`, query)

    let typedRes: ApiResult<any> = plainToInstance(ApiResult<any>, res)

    if (typedRes && typedRes.object) {

      typedRes.object = plainToInstance(DeleteManyResult, typedRes.object)
    }

    return typedRes

  }


  /*
  async createCheckoutSession$(checkout: CreateCheckoutSession): Promise<any> {

    return this.post$(this.sessionSvc.backend, 'stripe/createCheckoutSession', checkout)

  }
*/

  create<T>(dbObject: DbObjectCreate<T>): Observable<ApiResult<T>> {

    return this.http.post<ApiResult<T>>(`${this.sessionSvc.backend}/${this.sessionSvc.branchUnique}/objects/create`, dbObject).pipe(map(res => {

      if (res && res.object) {

        const object = res.object
        res = plainToInstance(ApiResult, res)
        res.object = plainToInstance(dbObject.type, object)
      }

      return res

    }
    ))
  }



  async create$<T>(dbObject: DbObjectCreate<T>): Promise<ApiResult<T>> {

    const me = this

    return new Promise<ApiResult<T>>(function (resolve, reject) {

      me.create<T>(dbObject).pipe(take(1)).subscribe(res => {
        resolve(res)
      })

    })

  }





  createMany<T>(dbObjects: DbObjectMultiCreate<T>): Observable<ApiListResult<T>> {


    return this.http.post<ApiListResult<T>>(`${this.sessionSvc.backend}/${this.sessionSvc.branchUnique}/objects/createMany`, dbObjects).pipe(map(res => {

      if (res && res.data) {

        const data = res.data
        res = plainToInstance(ApiListResult<T>, res)
        res.data = plainToInstance(dbObjects.type, data)

      }

      return res

    }
    ))
  }


  async createMany$<T>(dbObjects: DbObjectMultiCreate<T>): Promise<ApiListResult<T>> {

    const me = this

    return new Promise<ApiListResult<T>>(function (resolve, reject) {

      me.createMany<T>(dbObjects).pipe(take(1)).subscribe(res => {
        resolve(res)
      })

    })

  }




  saveOrder(order: Order): Observable<ApiResult<Order>> {

    return this.http.post<ApiResult<Order>>(`${this.sessionSvc.backend}/${this.sessionSvc.branchUnique}/objects/saveOrder`, order).pipe(map(res => {

      console.error(res)

      let typedRes = res

      if (res && res.object) {

        const object = res.object

        typedRes = plainToInstance(ApiResult<Order>, res)

        if (typedRes.isOk)
          typedRes.object = plainToInstance(Order, object)
      }

      return typedRes

    }
    ))
  }


  async saveOrder$(order: Order): Promise<ApiResult<Order>> {

    const me = this

    return new Promise<ApiResult<Order>>(function (resolve, reject) {

      me.saveOrder(order).pipe(take(1)).subscribe(res => {
        resolve(res)
      })

    })

  }

  sendMessage(message: Message): Observable<ApiResult<Message>> {

    return this.http.post<ApiResult<Message>>(`${this.sessionSvc.backend}/${this.sessionSvc.branchUnique}/objects/sendMessage`, message).pipe(map(res => {

      console.error(res)

      let apiResult = res

      if (res && res.object) {

        const object = res.object

        apiResult = plainToInstance(ApiResult<Message>, res)

        if (apiResult.isOk)
          apiResult.object = plainToInstance(Message, object)
      }

      return apiResult

    }
    ))
  }


  sendMessage$(message: Message): Promise<ApiResult<Message>> {

    const me = this

    return new Promise<ApiResult<Message>>(function (resolve, reject) {
      me.sendMessage(message).pipe(take(1)).subscribe(res => {
        resolve(res)
      })
    })

  }





  query<T>(query: DbQueryTyped<T>): Observable<ApiListResult<T>> {

    console.warn(query)

    return this.http.post<ApiListResult<T>>(`${this.sessionSvc.backend}/${this.sessionSvc.branchUnique}/objects/query`, query).pipe(map(res => {

      if (res.data) {

        /** if explicit columns (proerties) are selected, then we will not convert to type T, otherwise not retrieved properties could be mis-interpreted */
        if (!query.selects || query.selects.length == 0) {
          const typedData = res.data.map(obj => plainToInstance(query.type, obj))
          res.data = typedData
        }
      }


      return res

    }
    ))
  }


  //     async findMany$<T>(typeName: string, prismaQuery: any): Promise<T[]> {

  /*
      let res = await this.post$(this.sessionSvc.backend, `${this.sessionSvc.branchUnique}/objects/deleteMany`, query)

    let typedRes: ApiResult<any> = plainToInstance(ApiResult<any>, res)
  */
  async findMany$<T>(prismaQuery: PrismaNativeQuery<T>): Promise<T[]> {

    let res = await this.post$(this.sessionSvc.backend, `${this.sessionSvc.branchUnique}/objects/findMany`, prismaQuery)

    if (Array.isArray(res)) {
      let typedRes = res.map(obj => plainToInstance(prismaQuery.type, obj))
      return typedRes
    }
  
    return []

  }

  async query$<T extends ObjectWithId>(query: DbQueryTyped<T>, useCache: boolean = true): Promise<T[]> {

    const me = this

    console.warn('============== query$ ')

    // if there is a cache available for the requested type => use cache
    if (me.typeCaches.has(query.type) && useCache) {

      const cacheSvc = me.typeCaches.get(query.type) as BackendHttpServiceBase<T>
      const objects = cacheSvc.queryFromCache(query)


      // attach missing objects
      switch (query.typeName) {
        case "product":
          let products = objects as unknown as Product[]
          await this.prodResSvc.attachResourcesToProducts(products)


      }

      console.warn(`From cache "${query.typeName}":`, objects)

      return objects
    }


    return new Promise<T[]>(function (resolve, reject) {

      me.query<T>(query).pipe(take(1)).subscribe(res => {

        if (res.data)
          resolve(res.data)
        else
          resolve([])

      })

    })

  }


  async queryFirst$<T extends ObjectWithId>(query: DbQueryTyped<T>): Promise<T | null> {


    const objects = await this.query$<T>(query)

    if (objects && objects.length > 0)
      return objects[0]
    else
      return null

  }

}
