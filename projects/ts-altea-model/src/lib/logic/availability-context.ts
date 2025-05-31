/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Order, OrderLine, PlanningBlockSeries, PlanningMode, PlanningType, Product, ProductResource, Resource, ResourceAvailability2, ResourcePlanning, ResourcePlannings, ResourceType, Schedule, TimeUnit } from "ts-altea-model"
import * as _ from "lodash";
import { TimeSpan } from "./dates/time-span";
import { AvailabilityRequest } from "./availability-request";
import { ResourceOccupationSets, DateRange, DateRangeSet } from "./dates";
import { BranchModeRange } from "./branch-mode";
import { ArrayHelper, DateHelper } from "ts-common";
import { AlteaPlanningQueries } from "ts-altea-logic";
import { StaffBreaks } from "./staff-breaks";


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

    groupToChildResources: Map<string, string[]>
    childToGroupResources: Map<string, string[]>

    /** current planning of all the resources (during interval [request.from, request.to] ) */
    resourcePlannings: ResourcePlannings = new ResourcePlannings() // empty set

    /** every resource can have 0, 1 or more schedules: a schedule defines when a resource is available for specific days of the week (for instance on mondays from 9:00 till 17:00, ...),
     * these schedules are Date independent (monday, tuesday, ... are OK, but not 04/12/2022)
     */
    schedules: Schedule[] = []

    /** Schedules converted to specific dates monday 09:00 till 17:00 -> [04/12/2022 09:00, 04/12/2022 17:00]. 
     * Map is indexed by resourceId !!!
     * Set by CreateAvailabilityContext.create(...)
      */
    scheduleDateRanges = new Map<string, DateRangeSet>()

    /** Other configs can be dependent upon the branch-mode (example: resource plannings) */
    branchModes: BranchModeRange[]

    timeUnite = TimeUnit.minutes

    products: Product[] = []
    //productIds: string[] = []

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
    // ctx?.scheduleDateRanges?.keys()

    _scheduleDateRangeKeys: string[]

    // implemented to fix: NG0100: ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked.
    scheduleDateRangeKeys(): string[] {

        if (!this.scheduleDateRanges)
            return []

        if (!this._scheduleDateRangeKeys || this._scheduleDateRangeKeys.length != this.scheduleDateRanges.size)
            this._scheduleDateRangeKeys = Array.from(this.scheduleDateRanges.keys())

        return this._scheduleDateRangeKeys
    }

    hasProduct(productId: string): boolean {

        if (ArrayHelper.IsEmpty(this.products))
            return false

        let productIdx = this.products.findIndex(p => p.id == productId) 

        return productIdx != -1
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

    getHumanResources(): Resource[] {
        if (ArrayHelper.IsEmpty(this.allResources))
            return []

        return this.allResources.filter(r => r.type == ResourceType.human)

    }

    getResources(resourceIds: string[]): Resource[] {

        if (ArrayHelper.IsEmpty(resourceIds))
            return []


        let resources = this.allResources.filter(res => resourceIds.indexOf(res.id) >= 0)

        return resources
    }

    /** Get all resources that are NOT a group (of other resources). So, these are the real resources: human, room, device */
    getAllNonGroupResources(): Resource[] {

        if (!Array.isArray(this.allResources) || this.allResources.length == 0)
            return []

        return this.allResources.filter(r => !r.isGroup)

    }

    /** Get all resources that are a group (of other resources). So, these are the real resources: human, room, device */
    getAllGroupResources(): Resource[] {

        if (!Array.isArray(this.allResources) || this.allResources.length == 0)
            return []

        return this.allResources.filter(r => r.isGroup)

    }

    getResourceGroups(resourceIds: Resource[]) {

        // this.resourceGroups

        /*
        let resource: Resource
        resource.children
        */

    }

    productsWithPlanning(): Product[] {

        const productIdsWithPlanning = this.productIdsWithPlanning()

        // productIdsWithPlanning.findIndex(id => prod.id === id) >= 0
        return this.products.filter(prod => _.includes(productIdsWithPlanning, prod.id))
    }


    staffBreaks: StaffBreaks = null

    /**
     * Is staff starts before 10h, then break should be between 12h20 & 14h40
     * If staff starts before 13h, then break between 17h and 19h
     * If later, then break between 17h20 and 19h
     * 
     * The already occupied ranges (existing bookings) are subtracted from the break ranges
     * 
     * @returns 
     */
    getStaffBreakRanges(availability2: ResourceAvailability2): StaffBreaks {

        if (this.staffBreaks)
            return this.staffBreaks

        this.staffBreaks = new StaffBreaks()
        // const breaksByResourceId = new Map<string, DateRangeSet>()

        const humanResources = this.allResources.filter(r => r.type == ResourceType.human && !r.isGroup)

        if (ArrayHelper.IsEmpty(humanResources))
            return this.staffBreaks

        const minTimeForBreak = TimeSpan.hours(6)


        for (let human of humanResources) {

            var schedule = availability2.getWorkingTime(human.id)

            /*
            var schedule = this.scheduleDateRanges.get(human.id)

            if (!schedule || schedule.isEmpty())
                continue
            */

            let breakRangesForResource = new DateRangeSet()
            

            for (let range of schedule.ranges) {

                // 
                if (range.duration.seconds < minTimeForBreak.seconds)
                    continue

                range.from

                if (range.containsLabels('START', 'END')) {

                    let from, to: Date
                    const startHour = range.from.getHours()

                    if (startHour <= 10) {
                        from = range.sameFromDateOtherHour(12, 20)
                        to = range.sameFromDateOtherHour(14, 40)
                    } else if (startHour <= 13) {
                        from = range.sameFromDateOtherHour(17, 0)
                        to = range.sameFromDateOtherHour(19, 0)
                    } else {
                        from = range.sameFromDateOtherHour(17, 20)
                        to = range.sameFromDateOtherHour(19, 0)
                    }

                    const breakRange = new DateRange(from, to)
                    breakRangesForResource.addRanges(breakRange)

                }

                console.log(range)
            }

            // there might already be plannings during (part of) the break => the possible break ranges decreases
            // const alreadyOccupied = this.resourcePlannings.filterByResource(human.id)


            const availability = availability2.getSetForResource(human.id)

            if (availability)
                breakRangesForResource = breakRangesForResource.subtract(availability.allocated)

            this.staffBreaks.breaksByResourceId.set(human.id, breakRangesForResource)

        }

        return this.staffBreaks




        // this.alteaDb.saveResourcePlannings()

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

    getBranchScheduleOnDate(date: Date): Schedule {
        // every branch is also a resource, containing the branch opening hours (schedules)
        const branchSchedules = this.schedules.filter(sched => sched.resourceId == this.branchId)

        const branchScheduleIds = branchSchedules.map(sched => sched.id!)
        const planning = this.resourcePlannings.filterBySchedulesDate(branchScheduleIds, date)

        if (planning) {
            let branchSchedule = branchSchedules.find(s => s.id == planning.scheduleId)
            return branchSchedule
        }

        return this.getDefaultSchedule(this.branchId)

    }


    /** the system can behave differently on certain time periods (holidays, etc): therefor we look for ranges with exact same behavior */
    getBranchModeRanges(dateRange: DateRange): BranchModeRange[] {

        const branchSchedules = this.getBranchSchedules(dateRange)

        const modes = []

        for (var i = 0; i < branchSchedules.byDate.length - 1; i++) {

            const branchSchedule = branchSchedules.byDate[i]
            const nextSchedule = branchSchedules.byDate[i + 1]

            const branchMode = new BranchModeRange(branchSchedule.start, nextSchedule.start, branchSchedule.schedule)
            modes.push(branchMode)
        }

        return modes

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

    getActiveSchedulesDuring(range: DateRange, scheduleIds: string[]): string[] {

        if (ArrayHelper.IsEmpty(scheduleIds))
            return []

        const activeScheduleIds: string[] = []

        // DEBUG
        let branchSchedules = this.getBranchSchedules(range)

        console.log(branchSchedules)


        for (let scheduleId of scheduleIds) {

            let schedule = this.schedules.find(s => s.id == scheduleId)

            if (!schedule?.resourceId)  // should not happen
                continue

            let resourceId = schedule.resourceId

            let resourceRanges = this.scheduleDateRanges.get(resourceId)
            let scheduleRanges = resourceRanges.filterBySchedule(scheduleId)

            if (!resourceRanges)
                continue

            let hasOverlap = scheduleRanges.hasOverlapWith(range)

            if (hasOverlap)
                activeScheduleIds.push(scheduleId)

        }

        return activeScheduleIds
    }

    getSchedule(scheduleId: string): Schedule | undefined {
        return this.schedules.find(s => s.id == scheduleId)
    }

    getSchedules(scheduleIds: string[]): Schedule[] {

        if (ArrayHelper.IsEmpty(scheduleIds))
            return []

        let schedules = this.schedules.filter(s => scheduleIds.indexOf(s.id) >= 0)
        return schedules
    }


    getSchedulesByResource(resourceId: string): Schedule[] {

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
     *  Only for products with planning mode block  (product.planMode == PlanningMode.block)
     */
    getBlockSeries(product: Product, onDate: Date): PlanningBlockSeries {

        if (product?.planMode != PlanningMode.block)
            throw `getBlockSeries(...) only for planMode=block`

        let schedule = this.getBranchScheduleOnDate(onDate)

        if (!schedule)
            throw `no branch schedule found on date`

        let blockSeries = product.getBlockSeries(schedule.id)

        /**
         * needs more fine-tuning! 
         */


        var time = `${("0" + onDate.getHours()).slice(-2)}:${("0" + onDate.getMinutes()).slice(-2)}`


        if (ArrayHelper.NotEmpty(blockSeries)) {
            blockSeries = _.orderBy(blockSeries, ['start'], ['asc'])

            /*
            let refSeries =blockSeries[0]
            for (let series of blockSeries) {

                if (series.start >= time)

            }*/

            var series = blockSeries.find(series => series.start >= time)

            if (series)
                return series
            else
                return blockSeries[blockSeries.length - 1]
        }

        return undefined

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

        let resourceSchedules = this.schedules.filter(s => s.resourceId === resourceId)
        let scheduleIds = resourceSchedules.map(s => s.id)

        // look for schedules active on given date
        let plannings = this.resourcePlannings.filterBySchedulesDateRange2(scheduleIds, date, date)


        if (plannings.notEmpty()) {
            // planning is found for a schedule => then return that schedule
            let planning = plannings.plannings[0]
            let scheduleId = planning.scheduleId

            let schedule = this.schedules.find(s => s.id == scheduleId)

            return schedule
        }

        // if not found, check if plannings are inherited from branch

        let branchScheduleIds = resourceSchedules.flatMap(schedule => schedule.scheduleIds)



        let branchPlannings = this.resourcePlannings.filterBySchedulesDateRange2(branchScheduleIds, date, date, this.branchId)

        if (branchPlannings.notEmpty()) {
            let branchPlanning = branchPlannings.plannings[0]
            let branchScheduleId = branchPlanning.scheduleId

            let schedule = this.schedules.find(schedule => schedule.resourceId == resourceId && schedule.scheduleIds.indexOf(branchScheduleId) >= 0)
            return schedule
        }


        // if not found, return default schedule

        let defaultSchedule = resourceSchedules.find(s => s.default)
        return defaultSchedule



    }

    getResourceOccupation(resourceId: string): ResourceOccupationSets {

        const exclusivePlannings = this.resourcePlannings.filterByResourceOverlapAllowed(resourceId, false)

        if (exclusivePlannings.isEmpty())
            return new ResourceOccupationSets()


        const availablePlannings = exclusivePlannings.filterByAvailable()
        const unavailable = exclusivePlannings.filterByAvailable(false)

        const result = new ResourceOccupationSets(exclusivePlannings, availablePlannings.toDateRangeSet(), unavailable.toDateRangeSet())

        return result

    }

    getResourceOccupation2(resourceId: string, isGroup = false): ResourceOccupationSets {

        let planningsForResource = this.resourcePlannings.filterByResource(resourceId, isGroup)

        // exclusive:  meaning no overlap allowed (can be both available or unavailable)
        const exclusivePlannings = planningsForResource.filterByOverlapAllowed(false)


        // const debug = this.resourcePlannings.filterByResource(resourceId)


        // some plannings can overlap: preparations of next block might overlap with cleanup of previous block
        const overlapAllowedPlannings = planningsForResource.filterByOverlapAllowed(true)

        if (exclusivePlannings.isEmpty() && overlapAllowedPlannings.isEmpty())
            return new ResourceOccupationSets()

        const availablePlannings = exclusivePlannings.filterByAvailable()

        let extraAvailabilitiesForResource = availablePlannings.filterByOverruleScheduleDay(false)

        /** these resourcePlannings (resourcePlanning.ors = true) overrule the default schedule for impacted days */
        let overrulingAvailabilitiesForResource = availablePlannings.filterByOverruleScheduleDay(true)

        const unavailable = exclusivePlannings.filterByAvailable(false)


        const absent = exclusivePlannings.filterByType(...AlteaPlanningQueries.absenceTypes())



        const result = new ResourceOccupationSets(
            planningsForResource,
            extraAvailabilitiesForResource.toDateRangeSet(),
            overrulingAvailabilitiesForResource.toDateRangeSet(),
            unavailable.toDateRangeSet(),
            overlapAllowedPlannings.toDateRangeSet(),
            absent.toDateRangeSet()
        )

        console.warn('AVAILABILITY', result)

        return result

    }

    getChildResources(...groupIds: string[]): Resource[] {

        let childResourceIds = this.getChildResourceIds(...groupIds)

        return this.getResources(childResourceIds) 
    }

    getChildResourceIds(...groupIds: string[]): string[] {

        if (!this.groupToChildResources || ArrayHelper.IsEmpty(groupIds))
            return []

        let resourceIds: string[] = []

        for (let groupId of groupIds) {
            if (!this.groupToChildResources.has(groupId))
                continue

            let childIds = this.groupToChildResources.get(groupId)

            if (ArrayHelper.NotEmpty(childIds))
                resourceIds.push(...childIds)
        }

        resourceIds = _.uniq(resourceIds)

        return resourceIds
    }

    getResourceGroupIds(...childResourceIds: string[]): string[] {

        if (ArrayHelper.IsEmpty(childResourceIds) || !this.childToGroupResources)
            return []

        let allGroupIds: string[] = []

        for (let childId of childResourceIds) {
            let groupIds = this.childToGroupResources.get(childId)

            if (ArrayHelper.IsEmpty(groupIds))
                continue

            for (let groupId of groupIds) {
                if (allGroupIds.indexOf(groupId) == -1)
                    allGroupIds.push(groupId)

            }

        }

        return allGroupIds
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
