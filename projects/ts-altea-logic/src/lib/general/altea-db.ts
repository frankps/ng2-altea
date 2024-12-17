import { ApiListResult, ApiResult, ApiStatus, DateHelper, DbObject, DbObjectCreate, DbObjectMulti, DbObjectMultiCreate, DbQuery, DbQueryBaseTyped, DbQueryTyped, DbUpdateManyWhere, ObjectHelper, ObjectWithId, QueryOperator } from 'ts-common'
import { Branch, Gift, Subscription, Order, OrderState, Organisation, Product, Resource, ResourcePlanning, Schedule, SchedulingType, Task, TaskSchedule, TaskStatus, Template, OrderLine, BankTransaction, Message, LoyaltyProgram, LoyaltyCard, PlanningType, ResourcePlannings, TemplateCode, MsgType, LoyaltyCardChange } from 'ts-altea-model'
import { Observable } from 'rxjs'
import { IDb } from '../interfaces/i-db'
import { AlteaPlanningQueries } from './altea-queries'
import * as dateFns from 'date-fns'

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

    async getOrdersStartingBetween(from: number, to: number) {

        const qry = new DbQueryTyped<Order>('order', Order)

        qry.include('contact')

        qry.and('start', QueryOperator.greaterThanOrEqual, from)
        qry.and('start', QueryOperator.lessThanOrEqual, to)
        qry.and('msg', QueryOperator.equals, true)
        qry.and('act', QueryOperator.equals, true)
        qry.and('state', QueryOperator.in, [OrderState.created, OrderState.waitDeposit, OrderState.confirmed])

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


    async getPosOrdersToCleanup(): Promise<Order[]> {

        const qry = new DbQueryTyped<Order>('order', Order)

        qry.and('state', QueryOperator.equals, OrderState.creation)
        qry.and('contactId', QueryOperator.equals, null)
        qry.and('src', QueryOperator.equals, 'pos')
        qry.and('paid', QueryOperator.equals, 0)

        let maxCreationDate = new Date()
        maxCreationDate = dateFns.subMinutes(maxCreationDate, 15)
        qry.and('cre', QueryOperator.lessThan, maxCreationDate)

        const orders = await this.db.query$<Order>(qry)

        return orders
    }


    async getAppOrdersToCleanup(): Promise<Order[]> {

        const qry = new DbQueryTyped<Order>('order', Order)

        qry.and('state', QueryOperator.equals, OrderState.creation)
        qry.and('paid', QueryOperator.equals, 0)
        //qry.and('contactId', QueryOperator.equals, null)
        qry.and('src', QueryOperator.equals, 'ngApp')
        // qry.include('contact')

        let maxCreationDate = new Date()
        maxCreationDate = dateFns.subMinutes(maxCreationDate, 20)
        qry.and('cre', QueryOperator.lessThan, maxCreationDate)

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
         *  => exclude plannings coming from same device
         */
        
        if (excludeClientId) {

            let lockCheck = qry.and()
            lockCheck.or('orderId', QueryOperator.equals, null)
            lockCheck.or('order.lock', QueryOperator.not, excludeClientId)

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

    async updateObject<T>(typeName: string, type: { new(): T; }, object: T, propertiesToUpdate: string[]): Promise<ApiResult<T>> {

        if (!object)
            return new ApiResult(null, ApiStatus.error, 'No object supplied to update!')

        let objectToUpdate = ObjectHelper.extractObjectProperties(object, ['id', ...propertiesToUpdate])

        let dbObject = new DbObject(typeName, type, objectToUpdate)

        let updateResult = await this.db.update$<T>(dbObject)

        return updateResult
    }

    async updateObjects<T>(typeName: string, type: { new(): T; }, objects: T[], propertiesToUpdate: string[]): Promise<ApiListResult<T>> {

        if (!Array.isArray(objects) || objects.length == 0)
            return new ApiListResult([], ApiStatus.ok)

        let objectsToUpdate = ObjectHelper.extractArrayProperties(objects, ['id', ...propertiesToUpdate])

        let dbObjectMany = new DbObjectMulti(typeName, type, objectsToUpdate)

        let updateResult = await this.db.updateMany$<ObjectWithId, T>(dbObjectMany)

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



    /** Gifts */

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

    async getPlanningsByTypes(resourceIds: string[], from: Date, to: Date, types: PlanningType[], branchId?: string): Promise<ResourcePlannings> {

        var qry = AlteaPlanningQueries.getByTypes(resourceIds, from, to, types, branchId)
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


    async getLoyaltyCards(contactId?: string): Promise<LoyaltyCard[]> {

        if (!contactId)
            contactId = this.branchId

        const qry = new DbQueryTyped<LoyaltyCard>('loyaltyCard', LoyaltyCard)

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

    async getLoyaltyPrograms(branchId?: string): Promise<LoyaltyProgram[]> {

        if (!branchId)
            branchId = this.branchId

        const qry = new DbQueryTyped<LoyaltyProgram>('loyaltyProgram', LoyaltyProgram)

        qry.and('branchId', QueryOperator.equals, branchId)
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




}