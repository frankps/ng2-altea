import { ApiListResult, ApiResult, DateHelper, DbObjectMulti, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
import { Branch, Order, OrderState, Organisation, Product, Resource, ResourcePlanning, Schedule, SchedulingType, Template } from 'ts-altea-model'
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

            //l.product = undefined
        })

        orderClone.info = undefined
        orderClone.persons = undefined

        // console.log(orderClone)

        // const orderDb = orderClone.asDbObject()

        const res = await this.db.saveOrder$(orderClone)

        console.warn(res)

        return res
    }


    async saveResourcePlannings(plannings: ResourcePlanning[]): Promise<ApiResult<ResourcePlanning[]>> {

        const dbPlannings = new DbObjectMulti<ResourcePlanning>('resourcePlanning', ResourcePlanning, plannings)

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
        qry.or('default', QueryOperator.equals, true)



        if (Array.isArray(includes) && includes.length > 0)
            qry.include(...includes)

        const schedules = await this.db.query$<Schedule>(qry)

        return schedules



    }




}