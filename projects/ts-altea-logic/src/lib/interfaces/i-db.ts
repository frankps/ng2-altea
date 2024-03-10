import { ApiListResult, ApiResult, DbObject, DbObjectCreate, DbObjectMulti, DbObjectMultiCreate, DbQuery, DbQueryTyped, ObjectWithId, QueryOperator } from 'ts-common'
import { Message, Order, Schedule, SchedulingType } from 'ts-altea-model'
import { Observable } from 'rxjs'

export interface IDb {

    // Generic methods  extends ObjectWithId
    update$<Inp extends ObjectWithId, Out>(dbObject: DbObject<Inp, Out>): Promise<ApiResult<Out>>

    // updateMany$<Inp extends ObjectWithId, Out>(dbObject: DbObjectMulti<Out>): Promise<ApiListResult<Out>>
    updateMany$<Inp extends ObjectWithId, Out>(dbObject: DbObjectMulti<Inp, Out>): Promise<ApiListResult<Out>>

    create$<T>(dbObject: DbObjectCreate<T>): Promise<ApiResult<T>>
    createMany$<T>(dbObject: DbObjectMultiCreate<T>): Promise<ApiListResult<T>>

    query$<T>(query: DbQueryTyped<T>): Promise<T[]>
    queryFirst$<T>(query: DbQueryTyped<T>): Promise<T | null>

    // Specialized methods
    saveOrder$(order: Order): Promise<ApiResult<Order>>
    sendMessage$(message: Message): Promise<ApiResult<Message>>

}