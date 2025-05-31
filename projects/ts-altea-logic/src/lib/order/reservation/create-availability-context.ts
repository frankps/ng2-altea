/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ArrayHelper, DbQuery, DbQueryTyped, ObjectHelper, QueryOperator } from 'ts-common'
import { AvailabilityRequest, Order, AvailabilityContext, Resource, ResourcePlanning, ResourceType, Schedule, SchedulingType, DateRangeSet, ResourcePlannings, BranchModeRange, DateRange, PlanningType } from 'ts-altea-model'
import { Observable } from 'rxjs'
import { AlteaDb } from '../../general/altea-db'
import { IDb } from '../../interfaces/i-db'
import * as _ from "lodash";

export class CreateAvailabilityContext {
    alteaDb: AlteaDb


    //  Next to do: load all active schedules in period (via scheduling)   3d841573-7667-46f0-a4b2-b496ed027740


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


        // ctx.configResources = ctx.order!.getProductResources()

        let resourceIds = ctx.order!.getAllResourceIds()

        ctx.branchId = ctx.order!.branchId!
        resourceIds.push(ctx.branchId)

        ctx.configResources = await this.alteaDb.getResources(resourceIds)
     //   ctx.configResources = await this.alteaDb.getResourcesActive(resourceIds, availabilityRequest.from, availabilityRequest.to)


        ctx.resourceGroups = await this.loadResourceGroupsWithChildren(ctx.configResources, availabilityRequest.from, availabilityRequest.to)

        /**
         * To do: only load groups where childeren are part of
         */
        //ctx.resourceGroups = await this.loadResourceGroupsForBranchWithChildren(ctx.branchId)

        ctx.allResources = this.unionOfResources(ctx.resourceGroups, ctx.configResources)

        ctx.allResourceIds = this.getResourceIds(ctx.configResources, true, ctx.resourceGroups)

        this.attachProductResources(ctx.order!, ctx.allResources)

        // Every branch has also a corresponding resource (to manage holidays, opening hours, etc of the branch)       

        // Already added before: re-check!
        // ctx.allResourceIds.push(ctx.branchId)

        /** We don't want the current order to block itself => exclude previous made plannings for this order */
        let excludeOrderId = ctx.order.id

        
        let clientId = ctx.order.lock

        let includeGroupPlannings = true
        ctx.resourcePlannings = await this.loadResourcePlannings(ctx.allResourceIds, availabilityRequest, includeGroupPlannings, excludeOrderId, clientId)


        // to debug
/*         let planId = 'b9f96be6-fda5-476f-9169-74514be783f6'
        let planning = ctx.resourcePlannings.getById(planId)
        console.warn('planning', planning) */
        // END debug

        /* get resource groups not previously loaded 
        */

        let resourceGroupIdsUsedInPlanning = ctx.resourcePlannings.getGroupOnlyPlanningIds()

        let newResourceGroupIdsUsedInPlanning = ArrayHelper.removeItems(resourceGroupIdsUsedInPlanning, ctx.allResourceIds)
        //resourceGroupIdsUsedInPlanning.filter(groupId => !ctx.allResourceIds.includes(groupId))

        if (ArrayHelper.NotEmpty(newResourceGroupIdsUsedInPlanning)) {

            const newResourceGroups = await this.alteaDb.getResources(newResourceGroupIdsUsedInPlanning, 'children.child')
            ctx.resourceGroups.push(...newResourceGroups)
            ctx.allResources.push(...newResourceGroups)
            const childResources = this.getChildResources(newResourceGroups)
            const childResourceIds = this.getChildResourceIds(newResourceGroups)
            const newChildResourceIds = ArrayHelper.removeItems(childResourceIds, ctx.allResourceIds)

            if (ArrayHelper.NotEmpty(newChildResourceIds)) {
                ctx.allResourceIds.push(...newChildResourceIds)
                const newChildResources = childResources.filter(res => newChildResourceIds.indexOf(res.id) >= 0)
                ctx.allResources.push(...newChildResources)
                let doNotIncludeGroupPlannings = false
                let extraPlannings = await this.loadResourcePlannings(newChildResourceIds, availabilityRequest, doNotIncludeGroupPlannings)
                ctx.resourcePlannings.add(extraPlannings)
            }

            ctx.allResourceIds.push(...newResourceGroupIdsUsedInPlanning)
        }


        this.createResourcesMaps(ctx)


        /* Load schedules of resources that have custom scheduling */
        const resourcesWithCustomSchedules = ctx.allResources.filter(r => r.customSchedule)

        const debugResNames = resourcesWithCustomSchedules.map(r => r.name)


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

        const productIds = order.getNotLoadedProductIds()

        if (productIds.length == 0)
            return order.getProducts()

        const products = await this.alteaDb.getProducts(productIds, 'resources.resource', 'prices')

        if (Array.isArray(products) && products.length > 0) {

            let linesProductsNotLoaded = order.lines.filter(l => !l.product)

            for (const line of linesProductsNotLoaded!) {

                const product = products.find(p => p.id == line.productId)

                line.product = product
            }
        }

        return order.getProducts()
    }


    /**
     * order.lines*.product.resources*.resource was sometimes missing (resource not previously loaded from product)
     * => attach the missing ones
     * 
     * @param order 
     * @param resources 
     * @returns 
     */
    attachProductResources(order: Order, resources: Resource[]) {

        if (!order || !order.hasLines() || ArrayHelper.IsEmpty(resources))
            return

        let productResources = order.lines.flatMap(l => l.product.resources)
        productResources = productResources.filter(pr => !pr.resource && pr.resourceId)

        for (let productResource of productResources) {
            let resource = resources.find(r => r.id == productResource.resourceId)

            if (resource)
                productResource.resource = resource
        }
    }

    /**
     * Fetch resource groups and all their containing resources and only return active resource during period [from, to]
     * 
     * @param resources only type='group' will be refetched from backend (with containing child resources)
     * @param loadExtraResourceIds used to fetch extra resources from backend in same API call (can be other resource type then 'group')
     * @returns 
     */
    async loadResourceGroupsWithChildren(resources: Resource[], from?: number, to?: number, ...loadExtraResourceIds: string[]): Promise<Resource[]> {

        const resourceGroups = resources.filter(r => r.isGroup)

        const resourceGroupIds = resourceGroups.map(res => res.id!)
        resourceGroupIds.push(...loadExtraResourceIds)

        let resourceGroupsExtra = await this.alteaDb.getResources(resourceGroupIds, 'children.child')

        resourceGroupsExtra = this.filterNonActiveChildResources(resourceGroupsExtra, from, to)

        return resourceGroupsExtra

    }


    filterNonActiveChildResources(resources: Resource[], from?: number, to?: number) : Resource[] {

        if (ArrayHelper.IsEmpty(resources))
            return resources

        let result = []

        for (let resource of resources) {

            /** clone, otherwise we are changing the master cache (the filters below were changing cache) */
            let clone : Resource = ObjectHelper.clone(resource, Resource)

            if (ArrayHelper.IsEmpty(clone.children))
                continue

            if (to)
                clone.children = clone.children.filter(lnk => !lnk.child.end || from <= lnk.child.end)

            if (from)
                clone.children = clone.children.filter(lnk => !lnk.child.start || to >= lnk.child.start)

            result.push(clone)

        }

        return result
    }



    async loadResourceGroupsForBranchWithChildren(branchId: string) {


        const resourceGroupsExtra = await this.alteaDb.getAllResourceGroupsForBranch(branchId, 'children.child')

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

    createResourcesMaps(ctx: AvailabilityContext) {

        let childToGroup = new Map<string, string[]>()
        let groupToChild = new Map<string, string[]>()

        if (ArrayHelper.IsEmpty(ctx.resourceGroups))
            return

        for (let group of ctx.resourceGroups) {

            if (!group.isGroup)
                continue

            let childResources = group.getChildResources()

            if (ArrayHelper.IsEmpty(childResources))
                continue

            let childResourceIds = childResources.map(res => res.id)
            groupToChild.set(group.id, childResourceIds)

            for (let childResourceId of childResourceIds) {
                if (childToGroup.has(childResourceId)) {
                    let groupIds = childToGroup.get(childResourceId)

                    if (groupIds.indexOf(group.id) == -1)
                        groupIds.push(group.id)

                } else {
                    childToGroup.set(childResourceId, [group.id])
                }

            }

        }

        ctx.childToGroupResources = childToGroup
        ctx.groupToChildResources = groupToChild



        return
    }




    /**
     * 
     * @param resourceIds 
     * @param availabilityRequest 
     * @param excludeOrderId sometimes we need to exclude current order id in order to be able to re-plan current order
     * @returns 
     */
    async loadResourcePlannings(resourceIds: string[], availabilityRequest: AvailabilityRequest, includeGroupPlannings: boolean, excludeOrderId?: string, clientId?: string): Promise<ResourcePlannings> {


        const resourcePlannings = await this.alteaDb.resourcePlannings(availabilityRequest.from, availabilityRequest.to, resourceIds, includeGroupPlannings, excludeOrderId, clientId)


        let plannings = new ResourcePlannings(resourcePlannings)

        plannings = this.removeMasksAlreadyPlanned(plannings)

        return plannings

    }



    /**
     * Remove masks that are already planned in the same period
     * @param plannings 
     * @returns 
     */
    removeMasksAlreadyPlanned(plannings: ResourcePlannings) : ResourcePlannings {

        if (!plannings)
            return plannings

        let groupMaskPlannings = plannings.getGroupPlannings(PlanningType.mask)

        if (groupMaskPlannings.isEmpty())
            return plannings

        let groupConcretePlannings = plannings.getGroupPlannings(PlanningType.occ)

        for (let groupPlanning of groupConcretePlannings.plannings) {

            let groupId = groupPlanning.resourceGroupId

            let maskPlanning = groupMaskPlannings.getGroupPlanning(groupId, groupPlanning.start, groupPlanning.end)

            if (maskPlanning) {
                plannings.remove(maskPlanning)
            }
        }

        return plannings
    }






}