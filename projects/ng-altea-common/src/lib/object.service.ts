/* eslint-disable @typescript-eslint/no-this-alias */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ObjectWithId, BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, ApiBatchResult, DbQuery, ObjectHelper, ApiStatus, ConnectTo, DbQueryTyped, DbObject, DbObjectMulti } from 'ts-common'
import { plainToInstance } from "class-transformer";
import { Observable, map, Subject, take } from "rxjs";
import { SessionService } from './session.service';
import { IDb } from 'ts-altea-logic';
import { CreateCheckoutSession, Message, Order } from 'ts-altea-model';


@Injectable({
  providedIn: 'root'
})
export class ObjectService implements IDb {

  constructor(protected http: HttpClient, protected sessionSvc: SessionService) { }


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




  update<T extends ObjectWithId>(dbObject: DbObject<T>): Observable<ApiResult<T>> {

    return this.http.put<ApiResult<T>>(`${this.sessionSvc.backend}/${this.sessionSvc.branchUnique}/objects/update`, dbObject).pipe(map(res => {

      if (res && res.object) {

        res.object = plainToInstance(dbObject.type, res.object)
      }

      return res

    }
    ))
  }



  async update$<T extends ObjectWithId>(dbObject: DbObject<T>): Promise<ApiResult<T>> {

    const me = this

    return new Promise<ApiResult<T>>(function (resolve, reject) {

      me.update<T>(dbObject).pipe(take(1)).subscribe(res => {
        resolve(res)
      })

    })

  }


  async updateMany$<Inp extends ObjectWithId, Out>(dbObject: DbObjectMulti<Out>): Promise<ApiListResult<Out>> {

    let res = await this.put$(this.sessionSvc.backend,`${this.sessionSvc.branchUnique}/objects/updateMany`, dbObject)

    let typedRes : ApiListResult<Out> = plainToInstance(ApiListResult<Out>, res)

    typedRes.data = plainToInstance(dbObject.type, typedRes.data)

    return typedRes
  }

  /*
  async createCheckoutSession$(checkout: CreateCheckoutSession): Promise<any> {

    return this.post$(this.sessionSvc.backend, 'stripe/createCheckoutSession', checkout)

  }
*/

  create<T>(dbObject: DbObject<T>): Observable<ApiResult<T>> {

    return this.http.post<ApiResult<T>>(`${this.sessionSvc.backend}/${this.sessionSvc.branchUnique}/objects/create`, dbObject).pipe(map(res => {

      if (res && res.object) {

        res.object = plainToInstance(dbObject.type, res.object)
      }

      return res

    }
    ))
  }



  async create$<T>(dbObject: DbObject<T>): Promise<ApiResult<T>> {

    const me = this

    return new Promise<ApiResult<T>>(function (resolve, reject) {

      me.create<T>(dbObject).pipe(take(1)).subscribe(res => {
        resolve(res)
      })

    })

  }



  createMany<T>(dbObjects: DbObjectMulti<T>): Observable<ApiResult<T[]>> {




    return this.http.post<ApiResult<T[]>>(`${this.sessionSvc.backend}/${this.sessionSvc.branchUnique}/objects/createMany`, dbObjects).pipe(map(res => {

      if (res && res.object) {

        res.object = plainToInstance(dbObjects.type, res.object)

      }

      return res

    }
    ))
  }


  async createMany$<T>(dbObjects: DbObjectMulti<T>): Promise<ApiResult<T[]>> {

    const me = this

    return new Promise<ApiResult<T[]>>(function (resolve, reject) {

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

      let typedRes = res

      if (res && res.object) {

        const object = res.object

        typedRes = plainToInstance(ApiResult<Message>, res)
        typedRes.object = plainToInstance(Message, object)
      }

      return typedRes

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

      // if (res.object)
      //   res.object = plainToInstance(this.type, res.object)
      return res

    }
    ))
  }



  async query$<T>(query: DbQueryTyped<T>): Promise<T[]> {

    const me = this

    return new Promise<T[]>(function (resolve, reject) {

      me.query<T>(query).pipe(take(1)).subscribe(res => {

        if (res.data)
          resolve(res.data)
        else
          resolve([])

      })

    })

  }


  async queryFirst$<T>(query: DbQueryTyped<T>): Promise<T | null> {


    const objects = await this.query$<T>(query)

    if (objects && objects.length > 0)
      return objects[0]
    else
      return null

  }

}
