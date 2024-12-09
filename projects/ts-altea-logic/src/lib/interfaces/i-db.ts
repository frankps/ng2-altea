import { ApiListResult, ApiResult, DbObject, DbObjectCreate, DbObjectMulti, DbObjectMultiCreate, DbQuery, DbQueryBase, DbQueryBaseTyped, DbQueryTyped, DbUpdateManyWhere, ObjectWithId, QueryOperator } from 'ts-common'
import { Message, Order, Schedule, SchedulingType } from 'ts-altea-model'
import { Observable } from 'rxjs'

export interface IDb {

    // Generic methods  extends ObjectWithId
    update$<Out>(dbObject: DbObject<Out>): Promise<ApiResult<Out>>

    // updateMany$<Inp extends ObjectWithId, Out>(dbObject: DbObjectMulti<Out>): Promise<ApiListResult<Out>>
    updateMany$<Inp extends ObjectWithId, Out>(dbObject: DbObjectMulti<Inp, Out>): Promise<ApiListResult<Out>>
    updateManyWhere$<T extends ObjectWithId>(update: DbUpdateManyWhere<T>): Promise<any> 

    create$<T>(dbObject: DbObjectCreate<T>): Promise<ApiResult<T>>
    createMany$<T>(dbObject: DbObjectMultiCreate<T>): Promise<ApiListResult<T>>

    query$<T  extends ObjectWithId>(query: DbQueryTyped<T>): Promise<T[]>
    queryFirst$<T  extends ObjectWithId>(query: DbQueryTyped<T>): Promise<T | null>

    deleteMany$<T extends ObjectWithId>(query: DbQueryBaseTyped<T>): Promise<any> 


    //  async deleteMany$<T extends ObjectWithId>(query: DbQueryBaseTyped<T>): Promise<any> 


    // Specialized methods
    saveOrder$(order: Order): Promise<ApiResult<Order>>
    sendMessage$(message: Message): Promise<ApiResult<Message>>




}  