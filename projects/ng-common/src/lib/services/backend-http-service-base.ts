import { HttpClient } from '@angular/common/http';
import { ObjectWithId, BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, ApiBatchResult, DbQuery, ObjectHelper, ApiStatus, ConnectTo } from 'ts-common'
import { instanceToPlain, plainToInstance } from "class-transformer";
import { Observable, map, Subject, take } from "rxjs";


export enum ObjectChangeType {
  create = 'create',
  update = 'update', 
  delete = 'delete'
}

export class ObjectChange<T> {
  constructor(public object: T, public change: ObjectChangeType) {}
}



export class BackendHttpServiceBase<T extends ObjectWithId> extends BackendServiceBase<T> {   //  extends BaseObject

  changes$: Subject<ObjectChange<T>> = new Subject<ObjectChange<T>>()

  constructor(protected type: { new(): T; }, private host: string, private urlDifferentiator: string, private http: HttpClient) {
    super()
  }

  get(id: string, includes: string | null = null): Observable<T> {

    const queryString = []

    if (includes) {
      includes = includes?.trim()
      if (includes.length > 0) queryString.push(`include=${includes}`)
    }

    let query = ''
    if (queryString.length > 0) {
      query = `?${queryString.join('&')}`
    }

    return this.http.get<T>(`${this.host}/${this.urlDifferentiator}/${id}${query}`).pipe(map(obj => {
      const inst = plainToInstance(this.type, obj)
      return inst
    }
    ))
  }

  getMany(take: number = 100): Observable<ApiListResult<T>> {
    return this.http.get<ApiListResult<T>>(`${this.host}/${this.urlDifferentiator}?take=${take}`)
  }

  search(searchFor: string): Observable<ApiListResult<T>> {
    return this.http.get<ApiListResult<T>>(`${this.host}/${this.urlDifferentiator}?query=name~${searchFor}`)
  }

  search$(searchFor: string): Promise<T[]> {

    const me = this

    return new Promise<any>(function (resolve, reject) {

      me.search(searchFor).pipe(take(1)).subscribe(res => {

        resolve(res.data)

      })


    })

  }


  update(object: any, isSoftDelete: boolean = false): Observable<ApiResult<T>> {
    console.log(object)
    const observ = this.http.put<any>(`${this.host}/${this.urlDifferentiator}/${object.id}`, object).pipe(map(res => {

      console.warn('Update happened!!!', res)

      if (res && res.status === ApiStatus.ok) {
        console.warn('triggering changes$ !')

        this.changes$.next(new ObjectChange(object, isSoftDelete?ObjectChangeType.delete: ObjectChangeType.update))
      }

      return res
    }))

    return observ
  }

  update$(object: any): Promise<ApiResult<T>> {

    const me = this

    return new Promise<any>(function (resolve, reject) {

      me.update(object).pipe(take(1)).subscribe(res => {
        resolve(res)
      })

    })
  }




  replaceIdWithConnectTo(object: any) {

    Object.keys(object).forEach(key => {

      if (key.endsWith("Id")) {

        let prop = key.substring(0, key.length - 2)

        if (prop === "sched")
          prop = "schedule"

        // if (prop === "child")
        //   prop = "resource"

        object[prop] = new ConnectTo(object[key])

        delete object[key]

      }
    })
  }


  batchProcess(batch: ApiBatchProcess<T>): Observable<ApiBatchResult<T>> {

    return this.http.put<any>(`${this.host}/${this.urlDifferentiator}/batch`, batch)
  }


  batchProcess$(batch: ApiBatchProcess<T>): Promise<ApiBatchResult<T>> {

    const me = this

    return new Promise<any>(function (resolve, reject) {

      me.batchProcess(batch).pipe(take(1)).subscribe(res => {
        resolve(res)
      })


    })

  }


  delete(objectId: string): Observable<ApiResult<any>> {
    return this.http.delete<any>(`${this.host}/${this.urlDifferentiator}/${objectId}`)
  }

  create(object: any): Observable<ApiResult<T>> {
    return this.http.post<any>(`${this.host}/${this.urlDifferentiator}`, object).pipe(map(res => {
      if (res.object)
        res.object = plainToInstance(this.type, res.object)
      return res
    }
    ))
  }

  create$(object: any): Promise<ApiResult<T>> {

    const me = this

    return new Promise<any>(function (resolve, reject) {

      me.create(object).pipe(take(1)).subscribe(res => {

        resolve(res)

      })


    })

  }


  query(query: DbQuery): Observable<ApiListResult<T>> {

    console.warn(query)

    return this.http.post<ApiListResult<T>>(`${this.host}/${this.urlDifferentiator}/query`, query).pipe(map(res => {

      if (res.data) {
        const typedData = res.data.map(obj => plainToInstance(this.type, obj))
        res.data = typedData
      }

      // if (res.object)
      //   res.object = plainToInstance(this.type, res.object)
      return res

    }
    ))
  }

  query$(query: DbQuery): Promise<T[]> {

    const me = this

    return new Promise<any>(function (resolve, reject) {

      me.query(query).pipe(take(1)).subscribe(res => {

        resolve(res.data)

      })


    })

  }


}