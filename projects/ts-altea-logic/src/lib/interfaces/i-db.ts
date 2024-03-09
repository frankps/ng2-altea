import { ApiListResult, ApiResult, DbObject, DbObjectMulti, DbQuery, DbQueryTyped, ObjectWithId, QueryOperator } from 'ts-common'
import { Message, Order, Schedule, SchedulingType } from 'ts-altea-model'
import { Observable } from 'rxjs'

export interface IDb {

    // Generic methods
    update$<T extends ObjectWithId>(dbObject: DbObject<T>): Promise<ApiResult<T>>
    updateMany$<T extends ObjectWithId>(dbObject: DbObjectMulti<T>): Promise<ApiListResult<any>>
    
    create$<T>(dbObject: DbObject<T>): Promise<ApiResult<T>>
    createMany$<T>(dbObject: DbObjectMulti<T>): Promise<ApiResult<T[]>>

    query$<T>(query: DbQueryTyped<T>): Promise<T[]>
    queryFirst$<T>(query: DbQueryTyped<T>): Promise<T | null>

    // Specialized methods
    saveOrder$(order: Order): Promise<ApiResult<Order>>
    sendMessage$(message: Message): Promise<ApiResult<Message>>
    
}