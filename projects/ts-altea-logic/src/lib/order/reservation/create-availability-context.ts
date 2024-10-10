/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ArrayHelper, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
import { AvailabilityRequest, Order, AvailabilityContext, Resource, ResourcePlanning, ResourceType, Schedule, SchedulingType, DateRangeSet, ResourcePlannings, BranchModeRange, DateRange } from 'ts-altea-model'
import { Observable } from 'rxjs'
import { AlteaDb } from '../../general/altea-db'
import { IDb } from '../../interfaces/i-db'
import * as _ from "lodash";

export class CreateAvailabilityContext {
    alteaDb: AlteaDb




    //  Next to do: load all active schedules in period (via scheduling)


    constructor(protected db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    async create(availabilityRequest: AvailabilityRequest): Promise<AvailabilityContext> {


        if (!availabilityRequest.order)
            throw new Error(`order expected!`)

        if (!availabilityRequest.order.branchId)
            throw new Error(`branch not specified on order: order.branchId`)

        console.error('CreateAvailabilityContext.create()', availabilityRequest)

        const ctx = new AvailabilityContext(availabilityRequest)

        ctx.products = await this.attachProductsToOrderLines(ctx.order!)

        ctx.configResources = ctx.order!.getProductResources()



        ctx.branchId = ctx.order!.branchId!

        ctx.resourceGroups = await this.loadResourceGroupsWithChildren(ctx.configResources, ctx.branchId)

        ctx.allResources = this.unionOfResources(ctx.resourceGroups, ctx.configResources)

        ctx.allResourceIds = this.getResourceIds(ctx.configResources, true, ctx.resourceGroups)

        // Every branch has also a corresponding resource (to manage holidays, opening hours, etc of the branch)       
        ctx.allResourceIds.push(ctx.branchId)


        
        let excludeOrderId = ctx.order.id

        ctx.resourcePlannings = await this.loadResourcePlannings(ctx.allResourceIds, availabilityRequest, excludeOrderId)



        /* Load schedules of resources that have custom scheduling */
        const resourcesWithCustomSchedules = ctx.allResources.filter(r => r.customSchedule)
        const resourceIdsWithCustomSchedules = resourcesWithCustomSchedules.map(r => r.id!)
        //resourceIdsWithCustomSchedules.push(ctx.branchId)
        ctx.schedules = await this.loadSchedules(resourceIdsWithCustomSchedules, ctx.allResources)    // this.alteaDb.schedules(ctx.allResourceIds)

        ctx.scheduleDateRanges = this.createScheduleDateRanges(resourceIdsWithCustomSchedules, ctx.schedules, availabilityRequest.from, availabilityRequest.to, ctx.resourcePlannings)

        //ctx.planMissingStaffBreaks()

        console.warn(ctx.scheduleDateRanges)
        

        return ctx
    }






    /**
     * Create a new set containing all resources from both set1 and set2, including possible child resources
     * @param set1 
     * @param set2 
     * @returns 
     */
    unionOfResources(set1: Resource[], set2: Resource[], includeChildResources = true): Resource[] {

        const allResources: Resource[] = []

        if (Array.isArray(set1) && set1.length > 0)
            allResources.push(...set1)


        if (includeChildResources)
            allResources.forEach(resource => this.addChildResources(resource, allResources))
        // if (Array.isArray(set2) && set2.length > 0)
        //     allResources.push(...set2)

        for (const resource of set2) {

            if (allResources.findIndex(r => r.id == resource.id) >= 0)
                continue

            allResources.push(resource)

            if (includeChildResources)
                this.addChildResources(resource, allResources)

        }

        //_.uniq(allResources)
        return allResources
    }

    addChildResources(resource: Resource, addToList: Resource[]) {

        if (!resource || !Array.isArray(resource.children))
            return

        for (const resourceLink of resource.children) {

            if (!resourceLink.child)
                continue

            const childResource = resourceLink.child!

            if (addToList.findIndex(r => r.id == childResource.id) >= 0)
                continue

            addToList.push(childResource)

        }

    }

    /**
     * Load schedules by given ids and attach (previously fetched) resources to these schedules
     * 
     * @param resourceIds 
     * @param resources 
     * @returns 
     */
    async loadSchedules(resourceIds: string[], resources: Resource[]): Promise<Schedule[]> {

        const schedules = await this.alteaDb.schedules(resourceIds)

        this.attachResourcesToSchedules(schedules, resources)

        return schedules
    }




    createScheduleDateRanges(resourceIds: string[], schedules: Schedule[], from: Date | number, to: Date | number, resourcePlannings: ResourcePlannings): Map<string, DateRangeSet> {


        const index = new Map<string, DateRangeSet>()

        if (!Array.isArray(resourceIds) || resourceIds.length == 0 || !Array.isArray(schedules) || schedules.length == 0)
            return index
        /*
                for (const schedule of schedules) {
        
                    const dateRangeSet = schedule.toDateRangeSet(from, to)
                    index.set(schedule.id!, dateRangeSet)
                }
                */

        const wellnessId = 'b39b2d8a-9a06-46b8-8334-4fc400cfc2c5'

        for (const resourceId of resourceIds) {

            // start with the default schedule

            if (resourceId == wellnessId)  // for debugging
                console.warn('Handling wellness!!')

            const resourceSchedules = schedules.filter(s => s.resourceId == resourceId)

            const defaultSchedule = resourceSchedules.find(s => s.default)
            let dateRanges = defaultSchedule.toDateRangeSet(from, to, 'START', 'END')

            const otherSchedules = resourceSchedules.filter(s => !s.default)

            for (const otherSchedule of otherSchedules) {

                console.warn('OTHER SCHEDULE')

                // check if other schedule is active during period
                let otherSchedulePlannings: ResourcePlannings

                if (ArrayHelper.AtLeastOneItem(otherSchedule.scheduleIds))
                    otherSchedulePlannings = resourcePlannings.filterBySchedulesDateRange2(otherSchedule.scheduleIds, from, to)
                else
                    otherSchedulePlannings = resourcePlannings.filterByScheduleDateRange(otherSchedule.id, from, to)

                if (otherSchedulePlannings.isEmpty())
                    continue

                for (let planning of otherSchedulePlannings.plannings) {
                    dateRanges = dateRanges.subtractByDates(planning.start, planning.end)

                    let otherSet = otherSchedule.toDateRangeSet(from, to, 'START', 'END')

                    dateRanges = dateRanges.add(otherSet)
                }

            }

            index.set(resourceId, dateRanges)
        }


        return index

        // const branchDateRanges = branchSchedule?.toDateRangeSet(availabilityRequest.from, availabilityRequest.to)


    }




    attachResourcesToSchedules(schedules: Schedule[], resources: Resource[]) {

        if (!Array.isArray(resources) || resources.length == 0)
            return


        if (Array.isArray(schedules) && schedules.length > 0) {

            for (const schedule of schedules) {

                if (schedule.resourceId) {
                    const resource = resources.find(r => r.id == schedule.resourceId)
                    schedule.resource = resource
                }
            }

        }
    }


    /** Load all products with resource data
     *  order.lines[x].product.resources[y].resource
     *  Returns all products 
     */
    async attachProductsToOrderLines(order: Order) {

        const productIds = order.getProductIds()

        if (productIds.length == 0)
            return []

        const products = await this.alteaDb.getProducts(productIds, 'resources.resource')



        if (Array.isArray(products) && products.length > 0) {

            for (const line of order.lines!) {

                const product = products.find(p => p.id == line.productId)

                line.product = product

            }
        }

        return products


    }

    /**
     * Fetch resource groups and all their containing resources
     * 
     * @param resources only type='group' will be refetched from backend (with containing child resources)
     * @param loadExtraResourceIds used to fetch extra resources from backend in same API call (can be other resource type then 'group')
     * @returns 
     */
    async loadResourceGroupsWithChildren(resources: Resource[], ...loadExtraResourceIds: string[]): Promise<Resource[]> {

        const resourceGroups = resources.filter(r => r.isGroup)

        const resourceGroupIds = resourceGroups.map(res => res.id!)
        resourceGroupIds.push(...loadExtraResourceIds)

        const resourceGroupsExtra = await this.alteaDb.getResources(resourceGroupIds, 'children.child')

        return resourceGroupsExtra

    }


    getChildResources(resourceGroups: Resource[]): Resource[] {
        if (!resourceGroups)
            return []

        const resourceLinks = resourceGroups.flatMap(resGroup => resGroup.children)
        const childResources = resourceLinks.flatMap(link => link?.child!)

        return childResources
    }


    getChildResourceIds(resourceGroups: Resource[]): string[] {
        const childResources = this.getChildResources(resourceGroups)

        if (!childResources)
            return []

        const ids = childResources.map(res => res.id!)
        return ids
    }

    getResourceIds(resources: Resource[], includeChildResources: boolean, resourceGroups: Resource[]): string[] {

        if (!resources)
            return []

        const ids = resources.map(r => r.id!)

        if (includeChildResources) {
            const childResourceIds = this.getChildResourceIds(resourceGroups)
            ids.push(...childResourceIds)
        }

        return ids
    }


    async loadResourcePlannings(resourceIds: string[], availabilityRequest: AvailabilityRequest, excludeOrderId?: string): Promise<ResourcePlannings> {

        /*
Old Logic:
Possible issues: we don't check OrderStatus anymore

        List<ResourcePlanning> planning = this.Ctx.ResourcePlanning.Where(rp => ids.Contains(rp.ResourceId)
        && rp.End >= Context.justThisOneDay
        //      && rp.End >= now
        && rp.Start <= end
        && rp.IsActive
        && rp.OrderLine.Order.OrderStatus != OrderStatus.Cancelled
        && rp.OrderLine.Order.OrderStatus != OrderStatus.TimedOut
        && ((rp.OrderLine.Order.OrderStatus == OrderStatus.Confirmed && (Context.orderId != rp.OrderLine.OrderId)) || Context.lockId == "" || rp.OrderLine.Order.Lock != Context.lockId))
        .OrderBy(rp => rp.Start).ToList();
*/


        const resourcePlannings = await this.alteaDb.resourcePlannings(availabilityRequest.from, availabilityRequest.to, resourceIds, excludeOrderId)


        return new ResourcePlannings(resourcePlannings)



    }

    // resourceIds: string[]

    // async loadSchedules(resourceIds: string[]): Promise<Schedule[]> {

    //     const schedules = await this.alteaDb.schedules(resourceIds)

    //     return schedules
    // }


    // async loadScheduling(availabilityRequest: AvailabilityRequest) {

    // }







}