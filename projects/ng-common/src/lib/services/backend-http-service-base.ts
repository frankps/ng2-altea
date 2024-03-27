import { HttpClient } from '@angular/common/http';
import { ObjectWithId, BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, ApiBatchResult, DbQuery, ObjectHelper, ApiStatus, ConnectTo, QueryCondition, QueryOperator, ArrayHelper } from 'ts-common'
import { Type, instanceToPlain, plainToInstance } from "class-transformer";
import { Observable, map, Subject, take, of } from "rxjs";
import { Firestore, collection, collectionData, addDoc, CollectionReference, updateDoc, serverTimestamp, doc, setDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import * as _ from "lodash";
import { TypeInfo } from 'ts-altea-model';

export enum ObjectChangeType {
  create = 'create',
  update = 'update',
  delete = 'delete',
  softDelete = 'softDelete'
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

export class ObjectCache<T extends ObjectWithId> {
  objects: T[] = []

  @Type(() => Date)
  lastSync: Date


  updateObjectsInCache(objects: T[]): boolean {

    if (!ArrayHelper.AtLeastOneItem(objects))
      return false

    let atLeastOneChange = false

    for (let object of objects) {

      if (!object.id)
        continue

      let idx = this.objects.findIndex(obj => obj.id == object.id)

      if (idx >= 0)
        this.objects[idx] = object
      else
        this.objects.push(object)

      atLeastOneChange = true
    }

    return atLeastOneChange

  }



}


export class BackendHttpServiceBase<T extends ObjectWithId> extends BackendServiceBase<T> {   //  extends BaseObject
  protected firestore: Firestore = inject(Firestore)

  protected softDelete = false

  changes$: Subject<ObjectChange<T>> = new Subject<ObjectChange<T>>()

  /**
   * 
   * @param type 
   * @param host 
   * @param urlDifferentiator 
   * @param http 
   * @param firestoreDocUrl the full path of a firestore document that will be updated whenever this object type is updated
   */
  constructor(protected type: { new(): T; }, protected typeName: string, private host: string, private urlDifferentiator: string, private http: HttpClient, private firestoreDocUrl?: string) {
    super()

    this.changes$.subscribe(objectChange => this.updateCache(objectChange))
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

    if (this.caching) {

      
      let cachedObject = this.cache.objects.find(obj => obj.id == id)

      if (cachedObject) {
        console.warn('From cache:', cachedObject)
        return of(cachedObject)
      }
        

    }

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

        // notify about change & update local cache if needed: 
        this.changes$.next(new ObjectChange(object, isSoftDelete ? ObjectChangeType.softDelete : ObjectChangeType.update))

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

    if (this.softDelete) {

      let softDelete = {
        id: objectId,
        del: true,
        upd: new Date()
      }

      return this.update(softDelete, true)


    } else {

      const res = this.http.delete<any>(`${this.host}/${this.urlDifferentiator}/${objectId}`).pipe(map(res => {

        res = this.makeApiResultTyped(res)

        if (res.status == ApiStatus.ok) {

          // notify about change & update local cache if needed: 
          this.changes$.next(new ObjectChange<T>(objectId, ObjectChangeType.delete))
          this.updateFirestore()
        }

        return res
      }
      ))

      //this.changes$.next(new ObjectChange<T>(objectId, ObjectChangeType.delete))

      return res
    }
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


  query(query: DbQuery, useCache: boolean = true): Observable<ApiListResult<T>> {

    if (useCache && this.caching) {
      console.warn('Getting data from cache!')
      let objects = this.queryFromCache(query)
      return of(new ApiListResult<T>(objects))
    }


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




  query$(query: DbQuery, useCache: boolean = true): Promise<T[]> {




    const me = this

    return new Promise<any>(function (resolve, reject) {

      if (useCache && me.caching) {
        console.warn('Getting data from cache!')
        let objects = me.queryFromCache(query)
        resolve(objects)
      }


      me.query(query, useCache).pipe(take(1)).subscribe(res => {

        resolve(res.data)

      })


    })

  }

  async deleteMany$(query: DbQuery): Promise<ApiResult<any>> {

    let res = await this.post$<ApiResult<any>>(`${this.host}/${this.urlDifferentiator}/deleteMany`, query)

    return res

  }


  async queryFirst$(query: DbQuery, useCache: boolean = true): Promise<T> {

    // ObjectHelper.clone()
    query.take = 1
    let res = await this.query$(query, useCache)

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

  //cache: T[]

  cache: ObjectCache<T> = new ObjectCache<T>()
  cacheQuery: DbQuery
  caching: boolean = false
  linkedTypes: string[] = []


  async initCache(typeInfos: TypeInfo[]) {

    //this.cacheQuery = cacheQuery

    console.error('Start init cache')


    if (!this.loadCacheFromDisk())
      await this.loadFullCacheFromBackend()
    else
      await this.updateCacheFromBackend(typeInfos)

    this.caching = true

  }

  queryFromCache(query: DbQuery): T[] {

    let count = 0

    if (!this.cache)
      throw new Error('Cache not initialised!')

    let matches = this.cache.objects.filter(obj => {

      if (count >= query.take)
        return false

      for (let condition of query.where.and) {
        if (this.checkCondition(obj, condition) == false)
          return false
      }

      count++
      return true
    })

    if (ArrayHelper.AtLeastOneItem(query.order)) {

      const orderFields = query.order.map(o => o.field)
      const orders = query.order.map(o => o.order)
      matches = _.orderBy(matches, orderFields, orders)

    }

    return matches

  }

  checkCondition(obj: ObjectWithId, condition: QueryCondition) {

    const left = obj[condition.field]
    let leftString

    switch (condition.operator) {

      case QueryOperator.equals:
        return left == condition.value

      case QueryOperator.not:
        return left != condition.value

      case QueryOperator.contains:
        leftString = left as string
        var regex = new RegExp(condition.value, "i");
        return regex.test(leftString)

      //return leftString.includes(condition.value)

      case QueryOperator.startsWith:
        leftString = left as string
        return leftString.startsWith(condition.value)

      case QueryOperator.endsWith:
        leftString = left as string
        return leftString.endsWith(condition.value)

      case QueryOperator.in:

        if (!ArrayHelper.AtLeastOneItem(condition.value))
          return false

        return (_.findIndex(condition.value, item => item == left) >= 0)
      // condition.value.indexOf(left)


      default:
        throw new Error(`QueryOperator ${condition.operator} not implemented by cache`)
    }


  }


  loadCacheFromDisk(): boolean {

    let cacheString = localStorage.getItem(this.urlDifferentiator)

    if (!cacheString)
      return false

    try {

      //   const byteArray = this.str2ab(cacheString)
      //   const json = '' // this.decompress(byteArray)
      const json = cacheString
      const cache = JSON.parse(json)

      const typedCache = plainToInstance(ObjectCache<T>, cache)
      typedCache.objects = typedCache.objects.map(obj => plainToInstance(this.type, obj))
      // const typedData = objects.map(obj => plainToInstance(this.type, obj))

      console.warn('Cache loaded from disk', typedCache)

      this.cache = typedCache

      return true
    } catch (error) {

      console.error(error)
      return false

    }
  }


  async updateCache(objectChange: ObjectChange<T>) {

    if (!this.caching)
      return

    console.error('Update cache for change!!', objectChange)

    //if (objectChange.change == ObjectChangeType.)

    let objId = objectChange.objectId()

    switch (objectChange.change) {
      case ObjectChangeType.create:
        await this.refreshCachedObjectFromBackend(objId)
        this.writeCacheToStorage()

        break

      case ObjectChangeType.update:
      case ObjectChangeType.softDelete:
        {
          if (!objId)
            return

          const cachedObject = this.cache.objects.find(obj => obj.id == objId)
          const updates = objectChange.object
          delete updates['id']

          if (!cachedObject)
            throw new Error(`Can't update cache, because object not in cache (id=${objId})`)

          Object.keys(updates).forEach(property => {

            cachedObject[property] = updates[property]
          })
          this.writeCacheToStorage()

        }
        break

    }
  }


  /** refresh an individual object in the cache & saves cache to storage */
  async refreshCachedObjectFromBackend(id: string): Promise<T> {

    let qry = new DbQuery()
    qry.and('id', QueryOperator.equals, id)
    qry.includes = this.cacheQuery.includes  // include all necessary linked objects

    const obj = await this.queryFirst$(qry, false)

    console.error(obj)

    let idx = _.findIndex(this.cache.objects, obj => obj.id == id)

    if (obj) {

      if (idx >= 0) // remove & replace item in cache
        this.cache.objects.splice(idx, 1, obj)
      else
        this.cache.objects.push(obj)

    } else {

      if (idx >= 0) // object not found => remove item from cache
        this.cache.objects.splice(idx, 1)
    }

    this.writeCacheToStorage()

    return obj

  }


  async updateCacheFromBackend(typeInfos: TypeInfo[]) {


    let now = new Date()

    this.cache.lastSync

    const typeInfo = typeInfos.find(ti => ti.name == this.typeName)

    if (!typeInfo) {
      console.log(`Can not update cache from backend: no typeInfo existing for ${this.typeName}`)
      return
    }

    let lastUpdated: Date

    if (typeInfo) {
      lastUpdated = typeInfo.lastUpdated
    }

    if (lastUpdated && lastUpdated > this.cache.lastSync) {
      let updatedObjects = await this.getUpdatedObjects(this.cache.lastSync)

      console.warn('Updated CACHE objects', updatedObjects)

      if (this.cache.updateObjectsInCache(updatedObjects)) {
        this.cache.lastSync = now
        this.writeCacheToStorage()
      }

    }
  }



  async getUpdatedObjects(since: Date): Promise<T[]> {
    const qry = new DbQuery()
    qry.or('upd', QueryOperator.greaterThanOrEqual, since)
    qry.includes = this.cacheQuery.includes

    const objects = await this.query$(qry, false)

    return objects
  }

  async loadFullCacheFromBackend() {

    let me = this

    me.cache.objects = await me.query$(this.cacheQuery, false)
    me.cache.lastSync = new Date()

    //console.warn(me.cache)

    this.writeCacheToStorage()

  }

  writeCacheToStorage() {
    let me = this

    let json = JSON.stringify(me.cache)

    let cacheString = json  // await this.compressToString(json)
    localStorage.setItem(me.urlDifferentiator, cacheString)
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