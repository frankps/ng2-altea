/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Order, OrderLine, Product, ProductResource, Resource, ResourcePlanning, ResourcePlannings, ResourceType, Schedule, TimeUnit } from "../altea-schema";
import * as _ from "lodash";
import { TimeSpan } from "./dates/time-span";
import { AvailabilityRequest } from "./availability-request";
import { ResourceOccupationSets, DateRange, DateRangeSet } from "./dates";


export class BranchSchedule {
    constructor(public start: Date, public schedule: Schedule) { }
}

export class BranchSchedules {
    byDate: BranchSchedule[] = []
}

export class AvailabilityContext {

    request: AvailabilityRequest
    order?: Order

    branchId = ""

    allResourceIds: string[] = []

    /** all resources that are used in order.lines[x].product.resources[y].resource */
    configResources: Resource[] = []

    /** A resource group is a special resource: it contains other 'real' resources, child resources are loaded into resource.children. */
    resourceGroups: Resource[] = []

    /** all resources combined: union of configResources and resourceGroups */
    allResources: Resource[] = []

    /** current planning of all the resources (during interval [request.from, request.to] ) */
    resourcePlannings: ResourcePlannings = new ResourcePlannings() // empty set

    /** every resource can have 0, 1 or more schedules: a schedule defines when a resource is available for specific days of the week (for instance on mondays from 9:00 till 17:00, ...),
     * these schedules are Date independent (monday, tuesday, ... are OK, but not 04/12/2022)
     */
    schedules: Schedule[] = []

    /** Schedules converted to specific dates monday 09:00 till 17:00 -> [04/12/2022 09:00, 04/12/2022 17:00]. Map is indexed by resourceId.   */
    scheduleDateRanges = new Map<string, DateRangeSet>()

    timeUnite = TimeUnit.minutes

    products: Product[] = []
    productIds: string[] = []

    productResources: ProductResource[] = []

    constructor(availabilityRequest: AvailabilityRequest) {
        this.request = availabilityRequest
        this.order = availabilityRequest.order
    }

    test() {
        this.scheduleDateRanges.keys()

        let ranges = this.scheduleDateRanges.get('123')

        for (let range of ranges.ranges) {
            range.from
        }


    }

    getProduct(productId: string): Product | undefined {
        return this.products.find(p => p.id == productId)
    }

    productIdsWithPlanning(): string[] {

        let productIds = this.productResources.map(pr => pr.productId!)
        productIds = _.uniq(productIds)

        return productIds
    }

    getResource(resourceId: string): Resource | undefined {
        return this.allResources.find(r => r.id == resourceId)
    }

    /** Get all resources that are NOT a group (of other resources). So, these are the real resources: human, room, device */
    getAllNongGroupResources(): Resource[] {

        if (!Array.isArray(this.allResources) || this.allResources.length == 0)
            return []

        return this.allResources.filter(r => !r.isGroup)

    }

    productsWithPlanning(): Product[] {

        const productIdsWithPlanning = this.productIdsWithPlanning()

        // productIdsWithPlanning.findIndex(id => prod.id === id) >= 0
        return this.products.filter(prod => _.includes(productIdsWithPlanning, prod.id))
    }

    /** Not every orderLine requires plannings, only returns those orderLines that have resources linked to the product 5viq ProductResource-
     * 
     */
    orderlinesWithPlanning(): OrderLine[] {

        if (!this.order?.lines || this.order.lines.length == 0)
            return []

        //    const productIdsWithPlanning = this.productIdsWithPlanning()

        //    const orderlinesWithPlanning = this.order?.lines?.filter(ol => _.includes(productIdsWithPlanning, ol.productId))

        const orderlinesWithPlanning = this.order?.lines?.filter(ol => ol.product?.hasResources())
        return orderlinesWithPlanning
    }

    productResourcesForOrderLine(ol: OrderLine): ProductResource[] {

        return this.productResources.filter(pr => pr.productId = ol.productId)
    }

    /** returns all the schedules ordered per date within requested dateRange, starting with the schedule on dateRange.from, and ending with the schedule on dateRange.to.
     * So the array contains at least 2 items.
    */
    getBranchSchedules(dateRange: DateRange): BranchSchedules {

        const result = new BranchSchedules()

        // every branch is also a resource, containing the branch opening hours (schedules)
        const branchSchedules = this.schedules.filter(sched => sched.resourceId == this.branchId)

        // get the default opening hours of the branch 
        const defaultSchedule = branchSchedules.find(s => s.default)

        if (!defaultSchedule)
            throw new Error(`No default schedule availble for ${this.branchId}`)

        // get the exceptional schedules that might occur during the requested date range 
        const branchScheduleIds = branchSchedules.map(sched => sched.id!)
        const schedulePlannings = this.resourcePlannings.filterBySchedulesDateRange(branchScheduleIds, dateRange)

        // TO DO: solve overlaps

        if (schedulePlannings.isEmpty()) {

            result.byDate.push(new BranchSchedule(dateRange.from, defaultSchedule))
            result.byDate.push(new BranchSchedule(dateRange.to, defaultSchedule))

        } else {

            const nrOfPlannings = schedulePlannings.plannings.length

            for (let i = 0; i < nrOfPlannings; i++) {

                const curPlanning = schedulePlannings.plannings[i]

                let nextDate = null // = new Date(2100, 1, 1)

                if (i < nrOfPlannings - 1) {
                    const nextPlanning = schedulePlannings.plannings[i + 1]
                    nextDate = nextPlanning.startDate
                }

                const curSchedule = branchSchedules.find(s => s.id == curPlanning.scheduleId)

                if (i == 0) {
                    if (curPlanning.startDate <= dateRange.from) {
                        result.byDate.push(new BranchSchedule(dateRange.from, curSchedule as Schedule))
                    } else {
                        result.byDate.push(new BranchSchedule(dateRange.from, defaultSchedule))
                        result.byDate.push(new BranchSchedule(curPlanning.startDate, curSchedule as Schedule))
                    }

                } else if (i < nrOfPlannings - 1) {

                    result.byDate.push(new BranchSchedule(curPlanning.startDate, curSchedule as Schedule))

                }


                if (nextDate && nextDate > curPlanning.endDate)
                    result.byDate.push(new BranchSchedule(curPlanning.endDate, defaultSchedule))

                if (i == (nrOfPlannings - 1)) {

                    if (curPlanning.endDate < dateRange.to)
                        result.byDate.push(new BranchSchedule(dateRange.to, defaultSchedule))
                    else
                        result.byDate.push(new BranchSchedule(dateRange.to, curSchedule as Schedule))

                }

            }

            // for (const schedulePlanning of schedulePlannings.plannings) {

            //     const schedule = branchSchedules.find(s => s.id == schedulePlanning.scheduleId)

            //     if (schedule)
            //         result.byDate.push(new BranchSchedule(schedulePlanning.startDate, schedule))
            //     else
            //         throw new Error(`schedule could not be retrieved`)
            // }
        }

        return result
    }


    getSchedule(scheduleId: string): Schedule | undefined {
        return this.schedules.find(s => s.id == scheduleId)
    }

    getSchedules(resourceId: string): Schedule[] {

        if (!Array.isArray(this.schedules) || this.schedules.length == 0)
            return []

        return this.schedules.filter(s => s.resourceId === resourceId)
    }

    getDefaultSchedule(resourceId: string): Schedule | undefined {
        if (!Array.isArray(this.schedules) || this.schedules.length == 0)
            return undefined

        return this.schedules.find(s => s.resourceId === resourceId && s.default)
    }

    /**
     * A resource can have 0 or more schedules.
     * There is most likely 1 default schedule and optionally 1 or more custom schedules that are only active during certain periods (defined via resource planning)
     * @param resourceId 
     * @param date 
     * @returns 
     */
    getScheduleOnDate(resourceId: string, date: Date | number): Schedule {
        if (!Array.isArray(this.schedules) || this.schedules.length == 0)
            return undefined

        let schedules = this.schedules.filter(s => s.resourceId === resourceId)
        let scheduleIds = schedules.map(s => s.id)

        // look for schedules active on given date
        let plannings = this.resourcePlannings.filterBySchedulesDateRange2(scheduleIds, date, date)

        // if not found, return default schedule
        if (plannings.isEmpty()) {
            let defaultSchedule = schedules.find(s => s.default)
            return defaultSchedule
        }

        // planning is found for a schedule => then return that schedule
        let planning = plannings.plannings[0]
        let scheduleId = planning.scheduleId

        let schedule = this.schedules.find(s => s.id == scheduleId)

        return schedule
    }

    getResourceOccupation(resourceId: string): ResourceOccupationSets {

        const exclusivePlannings = this.resourcePlannings.filterByResourceOverlap(resourceId, false)

        if (exclusivePlannings.isEmpty())
            return new ResourceOccupationSets()


        const availablePlannings = exclusivePlannings.filterByAvailable()
        const unavailable = exclusivePlannings.filterByAvailable(false)

        const result = new ResourceOccupationSets(availablePlannings.toDateRangeSet(), unavailable.toDateRangeSet())

        return result

    }

    getResourceOccupation2(resourceId: string): ResourceOccupationSets {

        const exclusivePlannings = this.resourcePlannings.filterByResourceOverlap(resourceId, false)



        // some plannings can overlap: preparations of next block might overlap with cleanup of previous block
        const overlapAllowedPlannings = this.resourcePlannings.filterByResourceOverlap(resourceId, true)

        if (exclusivePlannings.isEmpty() && overlapAllowedPlannings.isEmpty())
            return new ResourceOccupationSets()

        const availablePlannings = exclusivePlannings.filterByAvailable()
        const unavailable = exclusivePlannings.filterByAvailable(false)

        const result = new ResourceOccupationSets(
            availablePlannings.toDateRangeSet(),
            unavailable.toDateRangeSet(),
            overlapAllowedPlannings.toDateRangeSet())

        return result

    }




    /* 
    
        getResourceGroupAvailability(resourceGroup: Resource, time: TimeSpan, nrOfResources = 1): DateRangeSet {
            
                    // For every child resource
                    // 1. Get default schedule resource (if not existing branch schedule) => DateRangeSet
                    // 2. Subtract the ResourcePlanning for the child resource
                    // 3. Get DateBorderSet.getBorderOverview()
           
    
            let result = new DateRangeSet()
    
    
            const childResources = resourceGroup.getChildResources()
    
            for (const childResource of childResources) {
    
                const childResourceId = childResource.id!
    
                const defaultSchedule = this.getDefaultSchedule(childResource.id!)
    
                if (!defaultSchedule) {
                    console.error(`No default schedule found for ${childResource.name}`)
                    continue
                }
    
                const resourceActive = this.scheduleDateRanges.get(defaultSchedule.id!)
    
                if (!resourceActive) {
                    console.error(`No schedule date ranges found for ${childResource.name}`)
                    continue
                }
    
                const resourceOccupation = this.getResourceOccupation(childResourceId)
    
                const resourceActiveExtended = resourceActive.add(resourceOccupation.available)
    
                const resourceStillAvailable = resourceActiveExtended.subtract(resourceOccupation.unAvailable)
    
                result = result.add(resourceStillAvailable)
    
                // this.resourcePlannings.find(rp => rp.id == )
    
    
            }
    
    
            return result
    
    
        } */

}
