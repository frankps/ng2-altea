import { HttpClient } from '@angular/common/http';
import { ObjectWithId, BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, ApiBatchResult, DbQuery, ObjectHelper, ApiStatus, ConnectTo } from 'ts-common'
import { instanceToPlain, plainToInstance } from "class-transformer";
import { Observable, map, Subject, take } from "rxjs";
import { Firestore, collection, collectionData, addDoc, CollectionReference, updateDoc, serverTimestamp, doc, setDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';

export enum ObjectChangeType {
  create = 'create',
  update = 'update',
  delete = 'delete'
}

export class ObjectChange<T extends ObjectWithId> {
  constructor(public object: T | string, public change: ObjectChangeType) { }

  objectId(): string {

    if (!this.object)
      return undefined

    if (typeof this.object == 'string')
      return this.object

    return this.object.id
  }

  obj(): T {
    return this.object as T
  }
}



export class BackendHttpServiceBase<T extends ObjectWithId> extends BackendServiceBase<T> {   //  extends BaseObject
  protected firestore: Firestore = inject(Firestore)

  changes$: Subject<ObjectChange<T>> = new Subject<ObjectChange<T>>()

  /**
   * 
   * @param type 
   * @param host 
   * @param urlDifferentiator 
   * @param http 
   * @param firestoreDocUrl the full path of a firestore document that will be updated whenever this object type is updated
   */
  constructor(protected type: { new(): T; }, private host: string, private urlDifferentiator: string, private http: HttpClient, private firestoreDocUrl?: string) {
    super()
  }

  async post$<T>(url: string, body: any): Promise<T> {
    const me = this

    return new Promise<T>(function (resolve, reject) {

      try {
        console.warn('post$', url, body)

        // .pipe(take(1))
        me.http.post<T>(url, body).pipe(take(1)).subscribe(res => {
          console.log(res)
          resolve(res)

        })

      } catch (error) {
        throw error
      }

    })
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

  get$(id: string, includes: string | null = null): Promise<T> {

    const me = this

    return new Promise<any>(function (resolve, reject) {

      me.get(id, includes).pipe(take(1)).subscribe(res => {
        resolve(res)
      })


    })

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


  makeApiResultTyped(res: ApiResult<T>) {

    if (!res)
      return res

    const result = plainToInstance(ApiResult<T>, res)

    if (res.object)
      result.object = plainToInstance(this.type, res.object)

    return result

  }


  update(object: any, isSoftDelete: boolean = false): Observable<ApiResult<T>> {
    console.log(object)
    const observ = this.http.put<any>(`${this.host}/${this.urlDifferentiator}/${object.id}`, object).pipe(map(res => {

      res = this.makeApiResultTyped(res)

      console.warn('Update happened!!!', res)

      if (res && res.status === ApiStatus.ok) {
        console.warn('triggering changes$ !')

        this.changes$.next(new ObjectChange(object, isSoftDelete ? ObjectChangeType.delete : ObjectChangeType.update))

        this.updateFirestore()
      }

      return res
    }))

    return observ
  }


  /** update a document in Firestore => other logic/apps know about update */
  async updateFirestore() {

    if (this.firestoreDocUrl) {
      const docRef = doc(this.firestore, this.firestoreDocUrl)
      await setDoc(docRef, { timestamp: serverTimestamp() })
    }
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
    const res = this.http.delete<any>(`${this.host}/${this.urlDifferentiator}/${objectId}`).pipe(map(res => {

      res = this.makeApiResultTyped(res)

      if (res.status == ApiStatus.ok) {
        this.changes$.next(new ObjectChange<T>(objectId, ObjectChangeType.delete))
        this.updateFirestore()
      }

      return res
    }
    ))

    //this.changes$.next(new ObjectChange<T>(objectId, ObjectChangeType.delete))

    return res
  }

  delete$(objectId: string): Promise<ApiResult<T>> {

    const me = this

    return new Promise<any>(function (resolve, reject) {

      me.delete(objectId).pipe(take(1)).subscribe(res => {

        //res = this.makeApiResultTyped(res)

        resolve(res)
      })


    })

  }



  create(object: any): Observable<ApiResult<T>> {
    return this.http.post<any>(`${this.host}/${this.urlDifferentiator}`, object).pipe(map(res => {

      res = this.makeApiResultTyped(res)

      if (res.status == ApiStatus.ok) {
        this.changes$.next(new ObjectChange(res.object, ObjectChangeType.create))
        this.updateFirestore()
      }

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

  async deleteMany$(query: DbQuery): Promise<ApiResult<any>> {

    let res = await this.post$<ApiResult<any>>(`${this.host}/${this.urlDifferentiator}/deleteMany`, query)

    return res

  }


  async queryFirst$(query: DbQuery): Promise<T> {

    let res = await this.query$(query)

    if (res?.length > 0)
      return res[0]
    else
      return undefined
  }



  async export(): Promise<T[]> {

    const query = new DbQuery()
    // query.includes = ''.split(',')
    query.take = 1000

    const objects = await this.query$(query)

    return objects
  }

  /**  Generic caching algorithm
   * 
   */

  cache: T[]
  cacheQuery: DbQuery

  async initCache() {

    //this.cacheQuery = cacheQuery

    console.error('Start init cache')


    if (!this.loadCacheFromDisk())
      this.refreshCacheFromServer(this.cacheQuery)


  }

  loadCacheFromDisk(): boolean {

    let cacheString = localStorage.getItem(this.urlDifferentiator)

    if (!cacheString)
      return false

    try {

      //   const byteArray = this.str2ab(cacheString)
      //   const json = '' // this.decompress(byteArray)
      const json = cacheString
      const objects = JSON.parse(json)
      const typedData = objects.map(obj => plainToInstance(this.type, obj))

      this.cache = typedData

      return true
    } catch (error) {

      console.error(error)
      return false

    }



  }


  async refreshCacheFromServer(dbQuery: DbQuery) {

    this.cache = await this.query$(dbQuery)

    let json = JSON.stringify(this.cache)

    let cacheString = json  // await this.compressToString(json)
    localStorage.setItem(this.urlDifferentiator, cacheString)

  }

  async compressToString(
    str: string,
    encoding = 'gzip' as CompressionFormat
  ): Promise<String> {

    let res = await this.compress(str, encoding)

    return this.ab2str(res)
  }

  async compress(
    str: string,
    encoding = 'gzip' as CompressionFormat
  ): Promise<ArrayBuffer> {
    const byteArray = new TextEncoder().encode(str)
    const cs = new CompressionStream(encoding)
    const writer = cs.writable.getWriter()
    writer.write(byteArray)
    writer.close()
    return new Response(cs.readable).arrayBuffer()
  }

  async decompress(
    byteArray: string[],
    encoding = 'gzip' as CompressionFormat
  ): Promise<string> {
    const cs = new DecompressionStream(encoding)
    const writer = cs.writable.getWriter()
    writer.write(byteArray)
    writer.close()
    const arrayBuffer = await new Response(cs.readable).arrayBuffer()
    //return arrayBuffer
    return new TextDecoder().decode(arrayBuffer)
  }

  ab2str(buf): string {

    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }
  str2ab(str) {
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }





}