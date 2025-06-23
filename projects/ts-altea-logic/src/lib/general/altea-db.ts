import { ApiListResult, ApiResult, ApiStatus, ArrayHelper, DateHelper, DbObject, DbObjectCreate, DbObjectMulti, DbObjectMultiCreate, DbQuery, DbQueryBaseTyped, DbQueryTyped, DbUpdateManyWhere, ObjectHelper, ObjectWithId, QueryCondition, QueryOperator, SortOrder, StringHelper, TypeHelper, YearMonth } from 'ts-common'
import { Branch, Gift, Subscription, Order, OrderState, Organisation, Product, Resource, ResourcePlanning, Schedule, SchedulingType, Task, TaskSchedule, TaskStatus, Template, OrderLine, BankTransaction, Message, LoyaltyProgram, LoyaltyCard, PlanningType, ResourcePlannings, TemplateCode, MsgType, LoyaltyCardChange, Payment, PaymentType, BankTxType, Payments, ReportMonth, ReportMonths, Contact, ReportPeriod, ReportType, ReportLine } from 'ts-altea-model'
import { Observable } from 'rxjs'
import { IDb } from '../interfaces/i-db'
import { AlteaPlanningQueries } from './altea-queries'
import * as dateFns from 'date-fns'
import { orderBy } from 'lodash'

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

        delete orderClone['branch']
        //delete orderClone['contact']

        orderClone.lines?.forEach(l => {

            delete l['product']
            delete l['orderId']


        })

        /*
        orderClone.payments?.forEach(p => {

            delete p['orderId']            
        })
            */

        /*         orderClone.info = undefined
                orderClone.persons = undefined
         */
        console.log(orderClone)

        // const orderDb = orderClone.asDbObject()

        const res = await this.db.saveOrder$(orderClone)

        console.warn(res)

        return res
    }




    async getBranch(branchId: string): Promise<Branch> {

        if (!branchId)
            return undefined

        const qry = new DbQueryTyped<Branch>('branch', Branch)

        qry.and('id', QueryOperator.equals, branchId)

        const branch = await this.db.queryFirst$<Branch>(qry)

        return branch
    }

    async getBranches(branchIds: string[]): Promise<Branch[]> {

        if (!Array.isArray(branchIds) || branchIds.length == 0)
            return []

        const qry = new DbQueryTyped<Branch>('branch', Branch)

        qry.and('id', QueryOperator.in, branchIds)

        const branches = await this.db.query$<Branch>(qry)

        return branches
    }

    async getContactById(id: string): Promise<Contact> {
        const object = await this.getObjectById$('contact', Contact, id)
        return object
    }


    async getExpiredDepositOrders(date: Date = new Date()): Promise<Order[]> {

        const dateNum = DateHelper.yyyyMMddhhmmss(date)

        const qry = new DbQueryTyped<Order>('order', Order)
        qry.and('state', QueryOperator.equals, OrderState.waitDeposit)
        qry.and('depoBy', QueryOperator.lessThan, dateNum)
        qry.and('paid', QueryOperator.equals, 0)
        qry.include('contact', 'lines')

        const expiredDepositOrders = await this.db.query$<Order>(qry)

        return expiredDepositOrders
    }


    async getOrder(orderId: string, ...includes: string[]): Promise<Order> {

        const qry = new DbQueryTyped<Order>('order', Order)

        qry.include('payments', ...includes)

        qry.and('id', QueryOperator.equals, orderId)

        const order = await this.db.queryFirst$(qry)

        return order
    }

    async getOrdersDepositTimeOut(date: Date = new Date()) {
        const qry = new DbQueryTyped<Order>('order', Order)

        qry.include('contact')

        const dateNum = DateHelper.yyyyMMddhhmmss(date)

        qry.and('depoBy', QueryOperator.lessThanOrEqual, dateNum)

        const orders = await this.db.query$<Order>(qry)

        return orders
    }

    async getOrdersStartingBetween(from: number, to: number, extra: any = null, includes?: string[]) {

        const qry = new DbQueryTyped<Order>('order', Order)

        if (ArrayHelper.IsEmpty(includes))
            qry.include('contact')
        else
            qry.include(...includes)

        qry.and('start', QueryOperator.greaterThanOrEqual, from)
        qry.and('start', QueryOperator.lessThanOrEqual, to)
        qry.and('msg', QueryOperator.equals, true)
        qry.and('act', QueryOperator.equals, true)
        qry.and('state', QueryOperator.notIn, [OrderState.cancelled, OrderState.creation])

        if (extra) {

            if (extra.contactId)
                qry.and('contactId', QueryOperator.equals, extra.contactId)

            if (ArrayHelper.NotEmpty(extra.branchIds))
                qry.and('branchId', QueryOperator.in, extra.branchIds)

        }


        const orders = await this.db.query$<Order>(qry)

        return orders

    }

    async getOrdersForContact(contactId: string, includes?: string[], take: number = 100, orderBy?: string, sort: SortOrder = SortOrder.asc): Promise<Order[]> {

        const qry = new DbQueryTyped<Order>('order', Order)

        if (includes)
            qry.include(...includes)

        qry.and('contactId', QueryOperator.equals, contactId)
        qry.take = take

        if (orderBy)
            qry.orderBy(orderBy, sort)

        const orders = await this.db.query$<Order>(qry)
        return orders

    }

    async getOrdersMissingInvoice(branchId: string): Promise<Order[]> {

        const qry = new DbQueryTyped<Order>('order', Order)

        qry.include('invoice.orders')

        qry.and('branchId', QueryOperator.equals, branchId)
        qry.and('toInvoice', QueryOperator.equals, true)

        qry.or('invoiced', QueryOperator.equals, false)
        qry.or('invoiceId', QueryOperator.equals, null)
        qry.or('invoiceNum', QueryOperator.equals, null)
        qry.take = 500

        const orders = await this.db.query$<Order>(qry)
        return orders

    }

    async getOrdersNeedingCommunication(date: Date = new Date()) {

        const qry = new DbQueryTyped<Order>('order', Order)

        qry.include('contact')

        const dateNum = DateHelper.yyyyMMddhhmmss(date)

        qry.and('msgOn', QueryOperator.lessThanOrEqual, dateNum)

        const orders = await this.db.query$<Order>(qry)

        return orders
    }

    async getOrders(state?: OrderState, take: number = 10): Promise<Order[]> {

        const qry = new DbQueryTyped<Order>('order', Order)
        // qry.and('branchId', QueryOperator.equals, branchId)

        if (state)
            qry.and('state', QueryOperator.equals, state)

        qry.take = take

        const orders = await this.db.query$<Order>(qry)

        return orders
    }

    async getOrdersForProducts(start: Date, end: Date, productIds: string[]): Promise<Order[]> {

        const qry = new DbQueryTyped<Order>('order', Order)

        qry.include('lines.product')

        let startNum = DateHelper.yyyyMMddhhmmss(start)
        let endNum = DateHelper.yyyyMMddhhmmss(end)


        qry.and('start', QueryOperator.greaterThanOrEqual, startNum)
        qry.and('start', QueryOperator.lessThanOrEqual, endNum)

        let orderLineFilter = new QueryCondition()
        orderLineFilter.and('productId', QueryOperator.in, productIds)

        qry.and('lines', QueryOperator.some, orderLineFilter)

        const orders = await this.db.query$<Order>(qry)

        return orders

    }
    async getOrdersWithPaymentsBetween(start: Date, end: Date, lastId?: string, take: number = 25, types?: PaymentType[]): Promise<Order[]> {   // , types?: PaymentType[]

        let startNum = DateHelper.yyyyMMddhhmmss(start)
        let endNum = DateHelper.yyyyMMddhhmmss(end)

        const qry = new DbQueryTyped<Order>('order', Order)
        qry.include('lines.product')
        qry.include('payments.gift')


        let queryById = null  // '02fb9cf9-59ed-40ec-85fd-6ac924ca8935'   //  null  // for debugging

        if (queryById) {
            qry.and('id', QueryOperator.equals, queryById)
        } else {


            let paymentFilter = new QueryCondition()
            paymentFilter.and('date', QueryOperator.greaterThanOrEqual, startNum)
            paymentFilter.and('date', QueryOperator.lessThan, endNum)

            if (ArrayHelper.NotEmpty(types)) {
                paymentFilter.and('type', QueryOperator.in, types)
            }

            qry.and('payments', QueryOperator.some, paymentFilter)

            if (lastId) {
                qry.and('id', QueryOperator.greaterThan, lastId)
            }

        }




        qry.orderBy('id')
        qry.take = take

        const orders = await this.db.query$<Order>(qry)

        return orders
    }

    async getPosOrdersToCleanup(): Promise<Order[]> {

        const qry = new DbQueryTyped<Order>('order', Order)


        qry.include('payments')

        qry.and('state', QueryOperator.equals, OrderState.creation)
        qry.and('contactId', QueryOperator.equals, null)
        qry.and('src', QueryOperator.equals, 'pos')
        qry.and('paid', QueryOperator.equals, 0)

        let now = new Date()
        let maxCreationDate = dateFns.subMinutes(now, 15)
        let minCreationDate = dateFns.subDays(now, 2)
        qry.and('cre', QueryOperator.lessThan, maxCreationDate)
        qry.and('cre', QueryOperator.greaterThanOrEqual, minCreationDate)

        const orders = await this.db.query$<Order>(qry)

        return orders
    }


    async getAppOrdersToCleanup(): Promise<Order[]> {

        const qry = new DbQueryTyped<Order>('order', Order)

        qry.include('payments')

        qry.and('state', QueryOperator.equals, OrderState.creation)

        //qry.and('contactId', QueryOperator.equals, null)
        qry.and('src', QueryOperator.equals, 'ngApp')
        // qry.include('contact')

        qry.or('paid', QueryOperator.equals, 0)
        qry.or('contactId', QueryOperator.equals, null)

        let now = new Date()
        let maxCreationDate = dateFns.subMinutes(now, 20)
        let minCreationDate = dateFns.subDays(now, 2)

        qry.and('cre', QueryOperator.lessThan, maxCreationDate)
        qry.and('cre', QueryOperator.greaterThanOrEqual, minCreationDate)

        const orders = await this.db.query$<Order>(qry)

        return orders
    }

    async updateOrder(order: Order, propertiesToUpdate: string[]): Promise<ApiResult<Order>> {
        let updateResult = await this.updateObject('order', Order, order, propertiesToUpdate)
        return updateResult
    }

    async updateOrders(orders: Order[], propertiesToUpdate: string[]): Promise<ApiListResult<Order>> {
        let updateResult = await this.updateObjects('order', Order, orders, propertiesToUpdate)
        return updateResult
    }



    async getTemplatesForBranches(branchIds: string[], code: string) {

        const qry = new DbQueryTyped<Template>('template', Template)
        qry.and('branchId', QueryOperator.in, branchIds)
        qry.and('code', QueryOperator.equals, code)

        const templates = await this.db.query$<Template>(qry)

        return templates
    }

    async getTemplates(branchId: string, code: TemplateCode | string): Promise<Template[]> {

        const qry = new DbQueryTyped<Template>('template', Template)
        qry.and('branchId', QueryOperator.equals, branchId)
        qry.and('code', QueryOperator.equals, code)

        const templates = await this.db.query$<Template>(qry)

        return templates
    }

    async getTemplate(branchId: string, code: TemplateCode | string, channel: MsgType): Promise<Template> {

        const qry = new DbQueryTyped<Template>('template', Template)
        qry.and('branchId', QueryOperator.equals, branchId)
        qry.and('code', QueryOperator.equals, code)
        qry.and('channels', QueryOperator.has, channel)

        const template = await this.db.queryFirst$<Template>(qry)

        return template
    }


    async getMessages(branchId: string, orderId: string, code: TemplateCode, fields?: string[]): Promise<Message[]> {

        const qry = new DbQueryTyped<Message>('message', Message)

        if (fields)
            qry.select(...fields)

        qry.and('branchId', QueryOperator.equals, branchId)
        qry.and('orderId', QueryOperator.equals, orderId)
        qry.and('code', QueryOperator.equals, code)

        const messages = await this.db.query$<Message>(qry)

        return messages
    }


    async getProduct(productId: string, ...includes: string[]): Promise<Product> {

        const qry = new DbQueryTyped<Product>('product', Product)

        qry.and('id', QueryOperator.equals, productId)

        if (Array.isArray(includes) && includes.length > 0)
            qry.include(...includes)

        const product = await this.db.queryFirst$<Product>(qry)

        return product
    }


    async getProducts(productIds: string[], ...includes: string[]): Promise<Product[]> {

        const qry = new DbQueryTyped<Product>('product', Product)

        qry.and('id', QueryOperator.in, productIds)

        if (Array.isArray(includes) && includes.length > 0)
            qry.include(...includes)

        const products = await this.db.query$<Product>(qry)

        return products
    }

    async getAllResourceGroupsForBranch(branchId: string, ...includes: string[]) {

        const qry = new DbQueryTyped<Resource>('resource', Resource)

        qry.and('branchId', QueryOperator.equals, branchId)
        qry.and('isGroup', QueryOperator.equals, true)

        if (Array.isArray(includes) && includes.length > 0)
            qry.include(...includes)

        const resources = await this.db.query$<Resource>(qry)

        return resources

    }

    async getResources(resourceIds: string[], ...includes: string[]): Promise<Resource[]> {

        const qry = new DbQueryTyped<Resource>('resource', Resource)

        qry.and('id', QueryOperator.in, resourceIds)

        let activeFilter = qry.and()
        activeFilter.or('end', QueryOperator.equals, null)

        let now = DateHelper.yyyyMMddhhmmss()
        activeFilter.or('end', QueryOperator.greaterThan, now)

        if (Array.isArray(includes) && includes.length > 0)
            qry.include(...includes)

        const resources = await this.db.query$<Resource>(qry)

        return resources
    }


    async getResourcesActive(resourceIds: string[], from?: number, to?: number, ...includes: string[]): Promise<Resource[]> {

        const qry = new DbQueryTyped<Resource>('resource', Resource)

        qry.and('id', QueryOperator.in, resourceIds)

        let activeFilter = qry.and()
        activeFilter.or('end', QueryOperator.equals, null)
        activeFilter.or('end', QueryOperator.greaterThan, to)

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

    /**
     * 
     * @param from 
     * @param to 
     * @param resourceIds 
     * @param excludeOrderId sometimes we need to exclude current order id in order to be able to re-plan current order 
     * @returns 
     */
    async resourcePlannings(from: number, to: number, resourceIds: string[], includeGroupPlannings: boolean, excludeOrderId?: string, excludeClientId?: string): Promise<ResourcePlanning[]> {

        console.warn('Loading resource plannings ... ')

        const qry = new DbQueryTyped<ResourcePlanning>('resourcePlanning', ResourcePlanning)

        qry.and('end', QueryOperator.greaterThanOrEqual, from)
        qry.and('start', QueryOperator.lessThanOrEqual, to)
        qry.and('act', QueryOperator.equals, true)

        // we don't need to see staff presence & holiday requests
        qry.and('type', QueryOperator.notIn, ['pres', 'holReq'])

        if (includeGroupPlannings) {
            let resourceFilter = qry.and()
            resourceFilter.or('resourceId', QueryOperator.in, resourceIds)
            resourceFilter.or('resourceId', QueryOperator.equals, null)
        } else {
            qry.and('resourceId', QueryOperator.in, resourceIds)
        }

        /** consumers are sometimes creating new orders from same device (without finishing previous order) 
         *  => exclude plannings coming from same device: excludeClientId
         */


        if (excludeClientId) {

            let lockCheck = qry.and()
            lockCheck.or('orderId', QueryOperator.equals, null)
            lockCheck.or('order.state', QueryOperator.in, [OrderState.confirmed, OrderState.waitDeposit])
            lockCheck.or('order.lock', QueryOperator.not, excludeClientId)

            let createdBefore = new Date()
            createdBefore = dateFns.subHours(createdBefore, 6)

            lockCheck.or('order.cre', QueryOperator.lessThan, createdBefore)

        }


        if (excludeOrderId) {
            qry.or('orderId', QueryOperator.not, excludeOrderId)
            qry.or('orderId', QueryOperator.equals, null)
        }

        /** exclude non-blocking tasks: tasks that can be overruled by new bookings */

        let excludeNonBlockingTasks = qry.and()
        excludeNonBlockingTasks.or('type', QueryOperator.not, PlanningType.tsk)
        excludeNonBlockingTasks.or('overlap', QueryOperator.equals, false)

        qry.take = 1000

        const resourcePlannings = await this.db.query$<ResourcePlanning>(qry)

        return resourcePlannings
    }



    async schedules(resourceIds: string[], ...includes: string[]): Promise<Schedule[]> {

        const qry = new DbQueryTyped<Schedule>('schedule', Schedule)

        qry.and('act', QueryOperator.equals, true)

        qry.or('resourceId', QueryOperator.in, resourceIds)
        // qry.or('default', QueryOperator.equals, true)

        if (Array.isArray(includes) && includes.length > 0)
            qry.include(...includes)

        const schedules = await this.db.query$<Schedule>(qry)

        return schedules

    }

    async getProductRelatedTasks() {

        const qry = new DbQueryTyped<Task>('task', Task)

        qry.include('product')

        qry.and('schedule', QueryOperator.equals, TaskSchedule.product)
        qry.and('act', QueryOperator.equals, true)

        const tasks = await this.db.query$<Task>(qry)

        return tasks
    }

    async getTasksForOrders(orderIds: string[]) {

        const qry = new DbQueryTyped<Task>('task', Task)

        qry.include('product')

        qry.and('orderId', QueryOperator.in, orderIds)
        qry.and('act', QueryOperator.equals, true)

        const tasks = await this.db.query$<Task>(qry)

        return tasks
    }


    async getRecurringTasks() {

        const qry = new DbQueryTyped<Task>('task', Task)

        qry.and('schedule', QueryOperator.not, TaskSchedule.once)
        qry.and('act', QueryOperator.equals, true)


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

    /** Generic methods 
     * 
     *  important: generate the specific methods with the generator, use (replace typeName):
    
        {
        "type": "dbMethods",
        "typeName": "gift",
        "plural": null
        }

    */
    async getObjectById$<T extends ObjectWithId>(typeName: string, type: { new(): T; }, id: string): Promise<T> {

        const qry = new DbQueryTyped<T>(typeName, type)
        qry.and('id', QueryOperator.equals, id)

        let object = await this.db.queryFirst$<T>(qry)

        return object
    }

    async getObjectsByIds<T extends ObjectWithId>(typeName: string, type: { new(): T; }, ids: string[]): Promise<T[]> {

        if (!Array.isArray(ids) || ids.length == 0)
            return []

        const qry = new DbQueryTyped<T>(typeName, type)
        qry.and('id', QueryOperator.in, ids)

        let objects: T[] = await this.db.query$<T>(qry)

        return objects
    }

    async updateObject<T>(typeName: string, type: { new(): T; }, object: T, propertiesToUpdate?: string[]): Promise<ApiResult<T>> {

        if (!object)
            return new ApiResult(null, ApiStatus.error, 'No object supplied to update!')

        let objectToUpdate

        if (ArrayHelper.NotEmpty(propertiesToUpdate))
            objectToUpdate = ObjectHelper.extractObjectProperties(object, ['id', ...propertiesToUpdate])
        else
            objectToUpdate = object

        let dbObject = new DbObject(typeName, type, objectToUpdate)

        let updateResult = await this.db.update$<T>(dbObject)

        return updateResult
    }

    async updatePartialObjects<T>(typeName: string, type: { new(): T; }, objects: any[]): Promise<ApiListResult<T>> {

        if (!Array.isArray(objects) || objects.length == 0)
            return new ApiListResult([], ApiStatus.ok)

        let dbObjectMany = new DbObjectMulti(typeName, type, objects)

        let updateResult = await this.db.updateMany$<ObjectWithId, T>(dbObjectMany)

        return updateResult
    }


    async updateObjects<T>(typeName: string, type: { new(): T; }, objects: T[], propertiesToUpdate: string[]): Promise<ApiListResult<T>> {

        if (!Array.isArray(objects) || objects.length == 0)
            return new ApiListResult([], ApiStatus.ok)

        let objectsToUpdate = ObjectHelper.extractArrayProperties(objects, ['id', ...propertiesToUpdate])

        let updateResult = await this.updatePartialObjects(typeName, type, objectsToUpdate)

        return updateResult
    }

    async createObject<T>(typeName: string, type: { new(): T; }, object: T): Promise<ApiResult<T>> {


        let dbObject = new DbObjectCreate<T>(typeName, type, object)
        let createResult = await this.db.create$(dbObject)

        return createResult
    }

    async createObjects<T>(typeName: string, type: { new(): T; }, objects: T[]): Promise<ApiListResult<T>> {

        if (!Array.isArray(objects) || objects.length == 0)
            return new ApiListResult([], ApiStatus.ok)

        let batch = new DbObjectMultiCreate<T>(typeName, type, objects)
        let createResult = await this.db.createMany$(batch)

        return createResult
    }

    async deleteObjectsByIds<T extends ObjectWithId>(typeName: string, type: { new(): T; }, objectIds: string[]): Promise<ApiResult<T>> {

        if (ArrayHelper.IsEmpty(objectIds))
            return ApiResult.ok('No objects to delete!')

        const qry = new DbQueryBaseTyped<T>(typeName, type)
        qry.and('id', QueryOperator.in, objectIds)

        const res = await this.db.deleteMany$(qry)

        return ApiResult.ok()
    }


    /*



    /** Gifts */


    async getGiftsToInvoice(from: Date, to: Date): Promise<Gift[]> {
        //const object = await this.getObjectById$('gift', Gift, id)

        const qry = new DbQueryTyped<Gift>('gift', Gift)
        qry.and('invoice', QueryOperator.equals, true)
        qry.and('cre', QueryOperator.greaterThanOrEqual, from)
        qry.and('cre', QueryOperator.lessThan, to)

        let gifts = await this.db.query$<Gift>(qry)

        return gifts
    }


    async getGiftByOrderId(orderId: string): Promise<Gift> {
        //const object = await this.getObjectById$('gift', Gift, id)

        const qry = new DbQueryTyped<Gift>('gift', Gift)
        qry.and('orderId', QueryOperator.equals, orderId)

        let object = await this.db.queryFirst$<Gift>(qry)

        return object
    }

    async getGiftById(id: string): Promise<Gift> {
        const object = await this.getObjectById$('gift', Gift, id)
        return object
    }

    async getGiftsByIds(ids: string[]): Promise<Gift[]> {
        const objects = await this.getObjectsByIds('gift', Gift, ids)
        return objects
    }

    async createGift(gift: Gift): Promise<ApiResult<Gift>> {
        let createResult = await this.createObject('gift', Gift, gift)
        return createResult
    }

    async createGifts(gifts: Gift[]): Promise<ApiListResult<Gift>> {
        let createResult = await this.createObjects('gift', Gift, gifts)
        return createResult
    }

    async updateGift(gift: Gift, propertiesToUpdate: string[]): Promise<ApiResult<Gift>> {
        let updateResult = await this.updateObject('gift', Gift, gift, propertiesToUpdate)
        return updateResult
    }

    async updateGifts(gifts: Gift[], propertiesToUpdate: string[]): Promise<ApiListResult<Gift>> {
        let updateResult = await this.updateObjects('gift', Gift, gifts, propertiesToUpdate)
        return updateResult
    }



    /** Subscriptions */

    async getSubscriptionsByOrderId(orderId: string): Promise<Subscription[]> {

        const qry = new DbQueryTyped<Subscription>('subscription', Subscription)
        qry.and('orderId', QueryOperator.equals, orderId)

        qry.and('act', QueryOperator.equals, true)
        qry.and('usedQty', QueryOperator.greaterThan, 0)

        let objects = await this.db.query$<Subscription>(qry)

        return objects
    }

    async getSubscriptionsByIds(ids: string[]): Promise<Subscription[]> {

        const objects = await this.getObjectsByIds('subscription', Subscription, ids)
        return objects
    }

    async createSubscriptions(subscriptions: Subscription[]): Promise<ApiListResult<Subscription>> {

        let createResult = await this.createObjects('subscription', Subscription, subscriptions)
        return createResult

    }

    async updateSubscription(subscription: Subscription, propertiesToUpdate: string[]): Promise<ApiResult<Subscription>> {

        let updateResult = await this.updateObject('subscription', Subscription, subscription, propertiesToUpdate)
        return updateResult
    }

    async updateSubscriptions(subscriptions: Subscription[], propertiesToUpdate: string[]): Promise<ApiListResult<Subscription>> {

        let updateResult = await this.updateObjects('subscription', Subscription, subscriptions, propertiesToUpdate)
        return updateResult

    }

    /** Order */

    async getOrdersByIds(ids: string[]): Promise<Order[]> {
        const objects = await this.getObjectsByIds('order', Order, ids)
        return objects
    }

    /** Orderline */

    async getOrderlinesByIds(ids: string[]): Promise<OrderLine[]> {
        const objects = await this.getObjectsByIds('orderLine', OrderLine, ids)
        return objects
    }

    async createOrderlines(orderLines: OrderLine[]): Promise<ApiListResult<OrderLine>> {
        let createResult = await this.createObjects('orderLine', OrderLine, orderLines)
        return createResult
    }

    async updateOrderline(orderLine: OrderLine, propertiesToUpdate: string[]): Promise<ApiResult<OrderLine>> {
        let updateResult = await this.updateObject('orderLine', OrderLine, orderLine, propertiesToUpdate)
        return updateResult
    }

    async updateOrderlines(orderLines: OrderLine[], propertiesToUpdate: string[]): Promise<ApiListResult<OrderLine>> {
        let updateResult = await this.updateObjects('orderLine', OrderLine, orderLines, propertiesToUpdate)
        return updateResult
    }

    /** BankTransaction */

    async getBankTransactionsByIds(ids: string[]): Promise<BankTransaction[]> {
        const objects = await this.getObjectsByIds('bankTransaction', BankTransaction, ids)
        return objects
    }

    async createBankTransactions(bankTransactions: BankTransaction[]): Promise<ApiListResult<BankTransaction>> {
        let createResult = await this.createObjects('bankTransaction', BankTransaction, bankTransactions)
        return createResult
    }

    async updateBankTransaction(bankTransaction: BankTransaction, propertiesToUpdate: string[]): Promise<ApiResult<BankTransaction>> {
        let updateResult = await this.updateObject('bankTransaction', BankTransaction, bankTransaction, propertiesToUpdate)
        return updateResult
    }

    async updateBankTransactions(bankTransactions: BankTransaction[], propertiesToUpdate: string[]): Promise<ApiListResult<BankTransaction>> {
        let updateResult = await this.updateObjects('bankTransaction', BankTransaction, bankTransactions, propertiesToUpdate)
        return updateResult
    }

    async getLatestBankTransaction(providerRefNotNull: boolean = false): Promise<BankTransaction> {

        const qry = new DbQueryTyped<BankTransaction>('bankTransaction', BankTransaction)


        if (providerRefNotNull) {
            qry.and('providerRef', QueryOperator.not, null)
        }


        qry.orderBy('execDate', SortOrder.desc)
        qry.orderBy('numInt', SortOrder.desc)

        const tx = await this.db.queryFirst$<BankTransaction>(qry)

        return tx
    }

    async getBankTransactionsBetween(start: number | Date, end: number | Date, types?: BankTxType[], extra?: any): Promise<BankTransaction[]> {

        let startNum: number
        let endNum: number

        if (TypeHelper.isDate(start))
            startNum = DateHelper.yyyyMMdd(start as Date)
        else
            startNum = start as number

        if (TypeHelper.isDate(end))
            endNum = DateHelper.yyyyMMdd(end as Date)
        else
            endNum = end as number


        const qry = new DbQueryTyped<BankTransaction>('bankTransaction', BankTransaction)

        qry.and('execDate', QueryOperator.greaterThanOrEqual, startNum)
        qry.and('execDate', QueryOperator.lessThanOrEqual, endNum)

        if (ArrayHelper.NotEmpty(types))
            qry.and('type', QueryOperator.in, types)

        if (extra) {

            if ('ok' in extra)
                qry.and('ok', QueryOperator.equals, extra.ok)

            if ('positiveAmount' in extra)
                qry.and('amount', QueryOperator.greaterThan, 0)

            if ('payments' in extra)
                qry.include('payments')

        }

        qry.take = 1000

        qry.orderBy('num')

        const payments = await this.db.query$<BankTransaction>(qry)

        return payments

    }

    /** ResourcePlanning */

    /** original (not-generated) method */
    async saveResourcePlannings(plannings: ResourcePlanning[]): Promise<ApiListResult<ResourcePlanning>> {


        console.error('saveResourcePlannings', plannings)

        let planningsForDb = ObjectHelper.unType(plannings, ['resource', 'resourceGroup', 'schedule', 'orderLine'])

        const dbPlannings = new DbObjectMultiCreate<ResourcePlanning>('resourcePlanning', ResourcePlanning, planningsForDb)

        const res = await this.db.createMany$<ResourcePlanning>(dbPlannings)

        return res
    }


    async getResourcePlanningsByOrderId(orderId: string): Promise<ResourcePlanning[]> {

        const qry = new DbQueryTyped<ResourcePlanning>('resourcePlanning', ResourcePlanning)
        qry.and('orderId', QueryOperator.equals, orderId)

        let objects = await this.db.query$<ResourcePlanning>(qry)

        return objects
    }

    async getPlanningsByTypes(resourceIds: string[], resourceGroupIds: string[], from: Date, to: Date, types: PlanningType[], branchId?: string): Promise<ResourcePlannings> {

        var qry = AlteaPlanningQueries.getByTypes(resourceIds, resourceGroupIds, from, to, types, branchId)
        console.warn(qry)
        const result = await this.db.query$<ResourcePlanning>(qry)

        return new ResourcePlannings(result)
    }




    async getResourcePlanningById(id: string): Promise<ResourcePlanning> {
        const object = await this.getObjectById$('resourcePlanning', ResourcePlanning, id)
        return object
    }
    async getResourcePlanningsByIds(ids: string[]): Promise<ResourcePlanning[]> {
        const objects = await this.getObjectsByIds('resourcePlanning', ResourcePlanning, ids)
        return objects
    }

    async createResourcePlannings(resourcePlannings: ResourcePlanning[]): Promise<ApiListResult<ResourcePlanning>> {
        let createResult = await this.createObjects('resourcePlanning', ResourcePlanning, resourcePlannings)
        return createResult
    }

    async updateResourcePlanning(resourcePlanning: ResourcePlanning, propertiesToUpdate: string[]): Promise<ApiResult<ResourcePlanning>> {
        let updateResult = await this.updateObject('resourcePlanning', ResourcePlanning, resourcePlanning, propertiesToUpdate)
        return updateResult
    }

    async updateResourcePlannings(resourcePlannings: ResourcePlanning[], propertiesToUpdate: string[]): Promise<ApiListResult<ResourcePlanning>> {
        let updateResult = await this.updateObjects('resourcePlanning', ResourcePlanning, resourcePlannings, propertiesToUpdate)
        return updateResult
    }

    async deletePlanningsForOrder(orderId: string, softDelete: boolean = true) {


        try {
            if (softDelete) {

                const updateClause = new DbUpdateManyWhere('resourcePlanning', ResourcePlanning)
                updateClause.addWhere('orderId', orderId)
                updateClause.set('act', false)
                updateClause.set('del', true)

                const res = await this.db.updateManyWhere$(updateClause)

            } else {
                const qry = new DbQueryBaseTyped<ResourcePlanning>('resourcePlanning', ResourcePlanning)
                qry.and('orderId', QueryOperator.equals, orderId)

                const res = await this.db.deleteMany$(qry)

                console.log(res)

            }

        } catch (error) {

            console.log(error)
        }
    }

    async deletePlanningsForOrders(orderIds: string[]) {

        const qry = new DbQueryBaseTyped<ResourcePlanning>('resourcePlanning', ResourcePlanning)
        qry.and('orderId', QueryOperator.in, orderIds)

        const res = await this.db.deleteMany$(qry)

    }


    async getLoyaltyCards(contactId?: string, includes?: string[]): Promise<LoyaltyCard[]> {

        if (!contactId)
            contactId = this.branchId

        const qry = new DbQueryTyped<LoyaltyCard>('loyaltyCard', LoyaltyCard)

        if (includes)
            qry.include(...includes)

        qry.and('contactId', QueryOperator.equals, contactId)

        const cards = await this.db.query$<LoyaltyCard>(qry)

        return cards
    }

    async getLoyaltyCardById(id: string): Promise<LoyaltyCard> {
        const object = await this.getObjectById$('loyaltyCard', LoyaltyCard, id)
        return object
    }
    async getLoyaltyCardsByIds(ids: string[]): Promise<LoyaltyCard[]> {
        const objects = await this.getObjectsByIds('loyaltyCard', LoyaltyCard, ids)
        return objects
    }

    async createLoyaltyCards(loyaltyCards: LoyaltyCard[]): Promise<ApiListResult<LoyaltyCard>> {
        let createResult = await this.createObjects('loyaltyCard', LoyaltyCard, loyaltyCards)
        return createResult
    }

    async updateLoyaltyCard(loyaltyCard: LoyaltyCard, propertiesToUpdate: string[]): Promise<ApiResult<LoyaltyCard>> {
        let updateResult = await this.updateObject('loyaltyCard', LoyaltyCard, loyaltyCard, propertiesToUpdate)
        return updateResult
    }

    async updateLoyaltyCards(loyaltyCards: LoyaltyCard[], propertiesToUpdate: string[]): Promise<ApiListResult<LoyaltyCard>> {
        let updateResult = await this.updateObjects('loyaltyCard', LoyaltyCard, loyaltyCards, propertiesToUpdate)
        return updateResult
    }

    async createLoyaltyCardChanges(cardChanges: LoyaltyCardChange[]): Promise<ApiListResult<LoyaltyCardChange>> {
        let createResult = await this.createObjects('loyaltyCardChange', LoyaltyCardChange, cardChanges)
        return createResult
    }

    async updateLoyaltyCardChanges(loyaltyCardChanges: LoyaltyCardChange[], propertiesToUpdate: string[]): Promise<ApiListResult<LoyaltyCardChange>> {
        let updateResult = await this.updateObjects('loyaltyCardChange', LoyaltyCardChange, loyaltyCardChanges, propertiesToUpdate)
        return updateResult
    }

    async getLoyaltyPrograms(branchId?: string): Promise<LoyaltyProgram[]> {

        if (!branchId)
            branchId = this.branchId

        const qry = new DbQueryTyped<LoyaltyProgram>('loyaltyProgram', LoyaltyProgram)

        qry.and('branchId', QueryOperator.equals, branchId)
        qry.and('act', QueryOperator.equals, true)
        qry.orderBy('idx')

        const progs = await this.db.query$<LoyaltyProgram>(qry)

        return progs
    }


    async getLoyaltyProgramById(id: string): Promise<LoyaltyProgram> {
        const object = await this.getObjectById$('loyaltyProgram', LoyaltyProgram, id)
        return object
    }
    async getLoyaltyProgramsByIds(ids: string[]): Promise<LoyaltyProgram[]> {
        const objects = await this.getObjectsByIds('loyaltyProgram', LoyaltyProgram, ids)
        return objects
    }

    async createLoyaltyPrograms(loyaltyPrograms: LoyaltyProgram[]): Promise<ApiListResult<LoyaltyProgram>> {
        let createResult = await this.createObjects('loyaltyProgram', LoyaltyProgram, loyaltyPrograms)
        return createResult
    }

    async updateLoyaltyProgram(loyaltyProgram: LoyaltyProgram, propertiesToUpdate: string[]): Promise<ApiResult<LoyaltyProgram>> {
        let updateResult = await this.updateObject('loyaltyProgram', LoyaltyProgram, loyaltyProgram, propertiesToUpdate)
        return updateResult
    }

    async updateLoyaltyPrograms(loyaltyPrograms: LoyaltyProgram[], propertiesToUpdate: string[]): Promise<ApiListResult<LoyaltyProgram>> {
        let updateResult = await this.updateObjects('loyaltyProgram', LoyaltyProgram, loyaltyPrograms, propertiesToUpdate)
        return updateResult
    }

    async getPaymentsByProvIds(provIds: string[]): Promise<Payment[]> {

        if (ArrayHelper.IsEmpty(provIds))
            return []

        const qry = new DbQueryTyped<Payment>('payment', Payment)

        qry.and('provId', QueryOperator.in, provIds)

        const payments = await this.db.query$<Payment>(qry)

        return payments

    }

    async getPaymentsBetween(branchId: string, start: number | Date, end: number | Date, types: PaymentType[], notLinkedToBankTx = false, includes?: string[]): Promise<Payments> {

        let startNum: number
        let endNum: number

        if (TypeHelper.isDate(start))
            startNum = DateHelper.yyyyMMddhhmmss(start as Date)
        else
            startNum = start as number

        if (TypeHelper.isDate(end))
            endNum = DateHelper.yyyyMMddhhmmss(end as Date)
        else
            endNum = end as number


        const qry = new DbQueryTyped<Payment>('payment', Payment)

        qry.and('order.branchId', QueryOperator.equals, branchId)

        qry.and('date', QueryOperator.greaterThanOrEqual, startNum)
        qry.and('date', QueryOperator.lessThanOrEqual, endNum)

        if (ArrayHelper.NotEmpty(types))
            qry.and('type', QueryOperator.in, types)


        if (notLinkedToBankTx)
            qry.and('bankTxId', QueryOperator.equals, null)

        qry.take = 1000

        qry.orderBy('date')

        if (ArrayHelper.NotEmpty(includes)) {
            qry.include(...includes)
        }
        //qry.include()

        const payments = await this.db.query$<Payment>(qry)

        return new Payments(payments)

    }



    async updatePayments(payments: Payment[], propertiesToUpdate: string[]): Promise<ApiListResult<Payment>> {
        let updateResult = await this.updateObjects('payment', Payment, payments, propertiesToUpdate)
        return updateResult
    }


    async getReportMonth(branchId: string, year: number, month: number): Promise<ReportMonth> {

        const qry = new DbQueryTyped<ReportMonth>('reportMonth', ReportMonth)

        qry.and('branchId', QueryOperator.equals, branchId)
        qry.and('year', QueryOperator.equals, year)
        qry.and('month', QueryOperator.equals, month)

        const report = await this.db.queryFirst$<ReportMonth>(qry)

        return report
    }


    async getReportMonthsForMonth(branchId: string, year: number, month: number, latest: boolean): Promise<ReportMonth[]> {

        const qry = new DbQueryTyped<ReportMonth>('reportMonth', ReportMonth)

        qry.and('branchId', QueryOperator.equals, branchId)
        qry.and('year', QueryOperator.equals, year)
        qry.and('month', QueryOperator.equals, month)

        if (latest)
            qry.and('latest', QueryOperator.equals, true)

        qry.orderBy('version', SortOrder.desc)

        const report = await this.db.query$<ReportMonth>(qry)

        return report
    }


    async getReportMonths(branchId: string): Promise<ReportMonths> {
        const qry = new DbQueryTyped<ReportMonth>('reportMonth', ReportMonth)

        qry.and('branchId', QueryOperator.equals, branchId)

        qry.orderBy('year', SortOrder.desc).orderBy('month', SortOrder.desc).orderBy('version', SortOrder.desc)

        const months = await this.db.query$<ReportMonth>(qry)

        return new ReportMonths(months)
    }

    async getReportMonthsPeriod(branchId: string, from: YearMonth, toInclusive: YearMonth, latestOnly: boolean): Promise<ReportMonths> {
        const qry = new DbQueryTyped<ReportMonth>('reportMonth', ReportMonth)


        qry.and('branchId', QueryOperator.equals, branchId)


        qry.and('year', QueryOperator.greaterThanOrEqual, from.y)
        //qry.and('month', QueryOperator.greaterThanOrEqual, from.m)

        qry.and('year', QueryOperator.lessThanOrEqual, toInclusive.y)
        //qry.and('month', QueryOperator.lessThanOrEqual, toInclusive.m)

        if (latestOnly)
            qry.and('latest', QueryOperator.equals, true)

        //  qry.orderBy('year', SortOrder.desc).orderBy('month', SortOrder.desc)

        qry.orderBy('year').orderBy('month')

        const months = await this.db.query$<ReportMonth>(qry)

        return new ReportMonths(months)
    }

    async getReportMonthById(id: string): Promise<ReportMonth> {
        const object = await this.getObjectById$('reportMonth', ReportMonth, id)
        return object
    }
    async getReportMonthsByIds(ids: string[]): Promise<ReportMonth[]> {
        const objects = await this.getObjectsByIds('reportMonth', ReportMonth, ids)
        return objects
    }


    async createReportMonth(reportMonth: ReportMonth): Promise<ApiResult<ReportMonth>> {
        let createResult = await this.createObject('reportMonth', ReportMonth, reportMonth)
        return createResult
    }

    async createReportMonths(reportMonths: ReportMonth[]): Promise<ApiListResult<ReportMonth>> {
        let createResult = await this.createObjects('reportMonth', ReportMonth, reportMonths)
        return createResult
    }

    async updateReportMonth(reportMonth: ReportMonth, propertiesToUpdate?: string[]): Promise<ApiResult<ReportMonth>> {
        let updateResult = await this.updateObject('reportMonth', ReportMonth, reportMonth, propertiesToUpdate)
        return updateResult
    }

    async updateReportMonths(reportMonths: ReportMonth[], propertiesToUpdate: string[]): Promise<ApiListResult<ReportMonth>> {
        let updateResult = await this.updateObjects('reportMonth', ReportMonth, reportMonths, propertiesToUpdate)
        return updateResult
    }


    async getReportLinesBetween(branchId: string, from: Date | number, to: Date | number, type?: ReportType, period?: ReportPeriod) {

        const qry = new DbQueryTyped<ReportLine>('reportLine', ReportLine)

        qry.and('branchId', QueryOperator.equals, branchId)

        if (period)
            qry.and('per', QueryOperator.equals, period)

        if (type)
            qry.and('type', QueryOperator.equals, type)

        if (from instanceof Date) {
            from = DateHelper.yyyyMMdd(from)
        }
        else {
            from = from as number
        }

        if (to instanceof Date) {
            to = DateHelper.yyyyMMdd(to)
        }
        else {
            to = to as number
        }


        qry.and('end', QueryOperator.greaterThan, from)
        qry.and('start', QueryOperator.lessThanOrEqual, to)

        qry.orderBy('start')

        qry.take = 10000

        const lines = await this.db.query$<ReportLine>(qry)

        return lines
    }

    async getReportLinesOn(branchId: string, per: ReportPeriod, type: ReportType, year: number, num: number, month?: number, resourceId?: string) {

        const qry = new DbQueryTyped<ReportLine>('reportLine', ReportLine)

        qry.and('branchId', QueryOperator.equals, branchId)
        qry.and('per', QueryOperator.equals, per)
        qry.and('type', QueryOperator.equals, type)
        qry.and('year', QueryOperator.equals, year)
        qry.and('num', QueryOperator.equals, num)

        if (month)
            qry.and('month', QueryOperator.equals, month)

        if (resourceId)
            qry.and('resId', QueryOperator.equals, resourceId)

        const lines = await this.db.query$<ReportLine>(qry)

        return lines
    }


    async getReportLineById(id: string): Promise<ReportLine> {
        const object = await this.getObjectById$('reportLine', ReportLine, id)
        return object
    }
    async getReportLinesByIds(ids: string[]): Promise<ReportLine[]> {
        const objects = await this.getObjectsByIds('reportLine', ReportLine, ids)
        return objects
    }


    async createReportLine(reportLine: ReportLine): Promise<ApiResult<ReportLine>> {
        let createResult = await this.createObject('reportLine', ReportLine, reportLine)
        return createResult
    }

    async createReportLines(reportLines: ReportLine[]): Promise<ApiListResult<ReportLine>> {
        let createResult = await this.createObjects('reportLine', ReportLine, reportLines)
        return createResult
    }

    async updateReportLine(reportLine: ReportLine, propertiesToUpdate?: string[]): Promise<ApiResult<ReportLine>> {
        let updateResult = await this.updateObject('reportLine', ReportLine, reportLine, propertiesToUpdate)
        return updateResult
    }

    async updateReportLines(reportLines: ReportLine[], propertiesToUpdate: string[]): Promise<ApiListResult<ReportLine>> {
        let updateResult = await this.updateObjects('reportLine', ReportLine, reportLines, propertiesToUpdate)
        return updateResult
    }


    /** Tasks */


    async getTasksByIds(ids: string[]): Promise<Task[]> {

        const objects = await this.getObjectsByIds('task', Task, ids)
        return objects
    }

    async createTasks(tasks: Task[]): Promise<ApiListResult<Task>> {

        let createResult = await this.createObjects('task', Task, tasks)
        return createResult

    }

    async updateTask(task: Task, propertiesToUpdate: string[]): Promise<ApiResult<Task>> {

        let updateResult = await this.updateObject('task', Task, task, propertiesToUpdate)
        return updateResult
    }

    async updateTasks(tasks: Task[], propertiesToUpdate: string[]): Promise<ApiListResult<Task>> {

        let updateResult = await this.updateObjects('task', Task, tasks, propertiesToUpdate)
        return updateResult

    }

    async deleteTasks(ids: string[]): Promise<any> {
        let deleteResult = await this.deleteObjectsByIds('task', Task, ids)
        return deleteResult
    }

}