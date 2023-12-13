import { Observable } from "rxjs";
import { ApiListResult } from "./api-list-result";
import { ApiResult } from "./api-result";
import { ApiBatchProcess, ApiBatchResult } from "./api-batch";
import { DbQuery } from "./query";



export abstract class BackendServiceBase<T> {   //  extends BaseObject
    abstract getMany(): Observable<ApiListResult<T>>
    abstract update(object: T): Observable<ApiResult<T>>
    abstract batchProcess(batch: ApiBatchProcess<T>): Observable<ApiBatchResult<T>>
    abstract delete(objectId: string): Observable<ApiResult<any>>
    abstract create(object: T): Observable<ApiResult<T>>

    abstract query(query: DbQuery): Observable<ApiListResult<T>>

}