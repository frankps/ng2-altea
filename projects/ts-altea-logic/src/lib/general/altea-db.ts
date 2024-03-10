import { ApiListResult, ApiResult, ApiStatus, DateHelper, DbObjectMulti, DbQuery, DbQueryTyped, ObjectHelper, ObjectWithId, QueryOperator } from 'ts-common'
import { Branch, Gift, Subscription, Order, OrderState, Organisation, Product, Resource, ResourcePlanning, Schedule, SchedulingType, Task, TaskSchedule, TaskStatus, Template } from 'ts-altea-model'
import { Observable } from 'rxjs'
import { IDb } from '../interfaces/i-db'



export class AlteaDb {

    constructor(public db: IDb, protected branchId?: string) {

    }

    async testApi(): Promise<ApiResult<Organisation>> {
        const org = new Organisation()
        org.name = 'demo 1'

        const res = await this.db.create$(org.asDbObject())

        console.warn(res)

        return res
    }


    async saveOrder(order: Order): Promise<ApiResult<Order>> {


        const orderClone = order.clone()

        delete orderClone['contact']

        orderClone.lines?.forEach(l => {

            delete l['product']
            delete l['orderId']

            //l.product = undefinedf
        })

        /*         orderClone.info = undefined
                orderClone.persons = undefined
         */
        console.log(orderClone)

        // const orderDb = orderClone.asDbObject()

        const res = await this.db.saveOrder$(orderClone)

        console.warn(res)

        return res
    }


    async saveResourcePlannings(plannings: ResourcePlanning[]): Promise<ApiResult<ResourcePlanning[]>> {


        console.error('saveResourcePlannings', plannings)

        let planningsForDb = ObjectHelper.unType(plannings, ['resource', 'resourceGroup', 'schedule', 'orderLine'])

        const dbPlannings = new DbObjectMulti<ResourcePlanning>('resourcePlanning', ResourcePlanning, planningsForDb)

        const res = await this.db.createMany$<ResourcePlanning>(dbPlannings)

        return res
    }

    async getBranches(branchIds: string[]): Promise<Branch[]> {

        if (!Array.isArray(branchIds) || branchIds.length == 0)
            return []

        const qry = new DbQueryTyped<Branch>('branch', Branch)

        qry.and('id', QueryOperator.in, branchIds)

        const branches = await this.db.query$<Branch>(qry)

        return branches
    }

    async getExpiredDepositOrders(): Promise<Order[]> {

        const now = DateHelper.yyyyMMddhhmmss()

        const qry = new DbQueryTyped<Order>('order', Order)
        qry.and('state', QueryOperator.equals, OrderState.waitDeposit)
        qry.and('depositBy', QueryOperator.lessThan, now)
        qry.include('contact', 'lines')

        const templates = await this.db.query$<Order>(qry)

        return templates
    }

    async getOrders(state: OrderState): Promise<Order[]> {

        const qry = new DbQueryTyped<Order>('order', Order)
        // qry.and('branchId', QueryOperator.equals, branchId)
        qry.and('state', QueryOperator.equals, state)

        const templates = await this.db.query$<Order>(qry)

        return templates
    }


    async getTemplatesForBranches(branchIds: string[], code: string) {

        const qry = new DbQueryTyped<Template>('template', Template)
        qry.and('branchId', QueryOperator.in, branchIds)
        qry.and('code', QueryOperator.equals, code)

        const templates = await this.db.query$<Template>(qry)

        return templates
    }

    async getTemplates(branchId: string, code: string): Promise<Template[]> {

        const qry = new DbQueryTyped<Template>('template', Template)
        qry.and('branchId', QueryOperator.equals, branchId)
        qry.and('code', QueryOperator.equals, code)

        const templates = await this.db.query$<Template>(qry)

        return templates
    }



    async getProducts(productIds: string[], ...includes: string[]): Promise<Product[]> {

        const qry = new DbQueryTyped<Product>('product', Product)

        qry.and('id', QueryOperator.in, productIds)

        if (Array.isArray(includes) && includes.length > 0)
            qry.include(...includes)

        const products = await this.db.query$<Product>(qry)

        return products
    }

    async getResources(resourceIds: string[], ...includes: string[]): Promise<Resource[]> {

        const qry = new DbQueryTyped<Resource>('resource', Resource)

        qry.and('id', QueryOperator.in, resourceIds)

        if (Array.isArray(includes) && includes.length > 0)
            qry.include(...includes)

        const resources = await this.db.query$<Resource>(qry)

        return resources
    }

    async scheduleGetDefault(branchId: string): Promise<Schedule | null> {

        const defaultScheduleQry = new DbQueryTyped<Schedule>('schedule', Schedule)

        /* Every branch has a resource with the same id 
        */
        defaultScheduleQry.and('resourceId', QueryOperator.equals, branchId)
        defaultScheduleQry.and('default', QueryOperator.equals, true)

        const defaultSchedule = await this.db.queryFirst$<Schedule>(defaultScheduleQry)

        return defaultSchedule
    }

    async branchSchedules(branchId?: string): Promise<Schedule[]> {

        if (!branchId)
            branchId = this.branchId

        const scheduleQry = new DbQueryTyped<Schedule>('schedule', Schedule)

        scheduleQry.select('id', 'name')
        /* Every branch has a resource with the same id 
        */
        scheduleQry.and('branchId', QueryOperator.equals, branchId)
        scheduleQry.and('resourceId', QueryOperator.equals, branchId)
        scheduleQry.orderBy('idx')

        const defaultSchedule = await this.db.query$<Schedule>(scheduleQry)

        return defaultSchedule
    }

    async resourcePlannings(from: number, to: number, resourceIds: string[]): Promise<ResourcePlanning[]> {

        console.warn('Loading resource plannings ... ')

        const qry = new DbQueryTyped<ResourcePlanning>('resourcePlanning', ResourcePlanning)

        qry.and('end', QueryOperator.greaterThanOrEqual, from)
        qry.and('start', QueryOperator.lessThanOrEqual, to)
        qry.and('active', QueryOperator.equals, true)
        qry.and('resourceId', QueryOperator.in, resourceIds)

        const resourcePlannings = await this.db.query$<ResourcePlanning>(qry)

        return resourcePlannings
    }



    async schedules(resourceIds: string[], ...includes: string[]): Promise<Schedule[]> {

        const qry = new DbQueryTyped<Schedule>('schedule', Schedule)

        qry.and('active', QueryOperator.equals, true)

        qry.or('resourceId', QueryOperator.in, resourceIds)
        // qry.or('default', QueryOperator.equals, true)

        if (Array.isArray(includes) && includes.length > 0)
            qry.include(...includes)

        const schedules = await this.db.query$<Schedule>(qry)

        return schedules

    }

    async getRecurringTasks() {

        const qry = new DbQueryTyped<Task>('task', Task)

        qry.and('schedule', QueryOperator.not, TaskSchedule.once)
        qry.and('active', QueryOperator.equals, true)


        console.error(qry)

        const tasks = await this.db.query$<Task>(qry)

        console.error(tasks)

        return tasks
    }

    async getTasksToDoORFinishedAfter(recurringTaskIds: string[], finishedAfter: Date): Promise<Task[]> {

        const qry = new DbQueryTyped<Task>('task', Task)

        qry.select('id', 'rTaskId', 'status', 'finishedAt')
        qry.and('rTaskId', QueryOperator.in, recurringTaskIds)

        //  qry.and('finishedAt', QueryOperator.greaterThan, finishedAfter)

        qry.or('status', QueryOperator.in, [TaskStatus.todo, TaskStatus.progress])
        qry.or('finishedAt', QueryOperator.greaterThan, finishedAfter)

        const tasks = await this.db.query$<Task>(qry)

        return tasks
    }

    /** Generic */

    async getObjectsByIds<T>(typeName: string, type: { new(): T; }, ids: string[]): Promise<T[]> {

        if (!Array.isArray(ids) || ids.length == 0)
            return []

        const qry = new DbQueryTyped<T>(typeName, type)
        qry.and('id', QueryOperator.in, ids)

        let objects: T[] = await this.db.query$<T>(qry)

        return objects
    }

    async updateObjects<T>(typeName: string, type: { new(): T; }, objects: T[], propertiesToUpdate: string[]): Promise<ApiListResult<T>> {

        if (!Array.isArray(objects) || objects.length == 0)
            return new ApiListResult([], ApiStatus.ok)

        let objectsToUpdate = ObjectHelper.extractArrayProperties(objects, ['id', ...propertiesToUpdate])

        let dbObjectMany = new DbObjectMulti(typeName, type, objectsToUpdate)

        let updateResult = await this.db.updateMany$<ObjectWithId, T>(dbObjectMany)

        return updateResult
    }

    /** Gifts */

    async getGiftsByIds(ids: string[]): Promise<Gift[]> {

        const gifts = await this.getObjectsByIds('gift', Gift, ids)
        return gifts
    }

    async updateGifts(gifts: Gift[], propertiesToUpdate: string[]): Promise<ApiListResult<Gift>> {

        let updateResult = await this.updateObjects('gift', Gift, gifts, propertiesToUpdate)
        return updateResult

    }


    /** Subscriptions */

    async getSubscriptionsByIds(ids: string[]): Promise<Subscription[]> {

        const gifts = await this.getObjectsByIds('subscription', Subscription, ids)

        return gifts

    }

    async updateSubscriptions(subscriptions: Subscription[], propertiesToUpdate: string[]): Promise<ApiListResult<Subscription>> {

        let updateResult = await this.updateObjects('subscription', Subscription, subscriptions, propertiesToUpdate)
        return updateResult

    }

    // "60dcf09d-49f5-42df-83cc-2f1ee6d11161"


}