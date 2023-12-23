import { ApiListResult, ApiResult, DbObject, DbObjectMulti, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
import { Message, Order, Schedule, SchedulingType } from 'ts-altea-model'
import { Observable } from 'rxjs'

export interface IDb {

    // Generic methods
    create$<T>(dbObject: DbObject<T>): Promise<ApiResult<T>>
    createMany$<T>(dbObject: DbObjectMulti<T>): Promise<ApiResult<T[]>>

    query$<T>(query: DbQueryTyped<T>): Promise<T[]>
    queryFirst$<T>(query: DbQueryTyped<T>): Promise<T | null>

    // Specialized methods
    saveOrder$(order: Order): Promise<ApiResult<Order>>
    sendMessage$(message: Message): Promise<ApiResult<Message>>
    
}