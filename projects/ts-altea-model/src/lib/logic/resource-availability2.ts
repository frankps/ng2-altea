
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Order, OrderLine, PlanningType, Product, ProductResource, Resource, ResourcePlanning, ResourcePlannings, ResourceType, Schedule } from "ts-altea-model"
import * as _ from "lodash";
import { TimeSpan } from "./dates/time-span";
import { AvailabilityRequest } from "./availability-request";
import { ResourceOccupationSets, DateRange, DateRangeSet, DateRangeSets, ResourceAvailabilitySets } from "./dates";
import { AvailabilityContext } from "./availability-context";
import { ArrayHelper, ObjectWithId } from 'ts-common'
import { Solution, SolutionNote, SolutionNoteLevel } from "./solution";
import * as dateFns from 'date-fns'
import { ResourceRequestItem } from "./resource-request";
import { ResultWithSolutionNotes } from "./resource-availability";


export class ResourceAvailability2 {

    /** availability indexed by resource id */
    availability = new Map<string, ResourceAvailabilitySets>()

    constructor(public ctx: AvailabilityContext) {

        let groupResources = ctx.getAllGroupResources()

        for (const groupResource of groupResources) {
            const resourceOccupation = ctx.getResourceOccupation2(groupResource.id, true)

            let groupAvailability = new ResourceAvailabilitySets(groupResource)

            groupAvailability.unavailable = resourceOccupation.unAvailable
            groupAvailability.overlapAllowed = resourceOccupation.overlapAllowed

            this.availability.set(groupResource.id, groupAvailability)

        }


        let resources = ctx.getAllNonGroupResources()

        // make sure the "branch" resource is the first one => determines the outer bounds of other resource availabilities

        let idx = resources.findIndex(r => r.type == ResourceType.branch)

        if (idx == -1)
            throw new Error('Missing branch resource')
        if (idx > 0) {
            let branchResource = resources.splice(idx, 1)
            resources = [...branchResource, ...resources]
        }


        let branchAvailability: DateRangeSet // = new DateRangeSet()


        for (const resource of resources) {

            const resourceId = resource.id!

            let noActive = false
            let noActiveInfo = ''

            if (!resource.act) {
                noActive = true
                noActiveInfo = `Resource not active`
            }

            if (resource.hasStart && resource.start && resource.start > ctx.request.to) {
                noActive = true
                noActiveInfo = `Resource not yet started`
            }


            if (resource.hasEnd && resource.end && resource.end < ctx.request.from) {
                noActive = true
                noActiveInfo = 'Resource ended'
            }

            if (noActive) {
                let noAvailability = new ResourceAvailabilitySets(resource)
                noAvailability.info = noActiveInfo
                this.availability.set(resourceId, noAvailability)
                continue
            }

            /*
            let frankId = 'cc682b80-6243-4ac5-92a9-5ceed36111a4'
            if (resourceId == frankId)
                console.error(' FRANK FOUND ----')
            */

            /** get the outer boundaries for this resource */
            let normalScheduleRanges: DateRangeSet //= ctx.scheduleDateRanges.get(resourceId)

            if (resource.customSchedule)
                normalScheduleRanges = ctx.scheduleDateRanges.get(resourceId)
            else
                normalScheduleRanges = branchAvailability   //ctx.scheduleDateRanges.get(ctx.branchId)


            normalScheduleRanges = normalScheduleRanges.clone()

            // for resources with multiple instances
            if (resource.qty > 1) {
                normalScheduleRanges.setQty(resource.qty)
            }


            if (!normalScheduleRanges) {
                console.error(`No schedule date ranges found for ${resource.name}`)
                continue
            }

            // get both the available & un-available date ranges
            const resourceOccupation = ctx.getResourceOccupation2(resourceId)
            console.error(resourceOccupation)

            let extendedSchedule = normalScheduleRanges

            if (resourceOccupation.overruleDayAvailable.notEmpty()) {
                var fullDayRanges = resourceOccupation.overruleDayAvailable.fullDayRanges()

                extendedSchedule = extendedSchedule.subtract(fullDayRanges)
                extendedSchedule = extendedSchedule.add(resourceOccupation.overruleDayAvailable)
            }

            if (resourceOccupation.extraAvailable.notEmpty())
                extendedSchedule = extendedSchedule.union(resourceOccupation.extraAvailable)

            extendedSchedule = extendedSchedule.subtract(resourceOccupation.absent)
            
            let workingHours = extendedSchedule.clone()
           
            if (workingHours.notEmpty()) {
                workingHours.sortRanges()
                workingHours.ranges[0].addFromLabel('START')
                workingHours.ranges[workingHours.ranges.length - 1].addToLabel('END')
            }

            extendedSchedule.removeBefore()

            //resourceOccupation.unAvailable
            let unavailable = resourceOccupation.unAvailable


            /** switch to new subtract */
            let resourceStillAvailable = extendedSchedule.subtractMany(unavailable)
            resourceStillAvailable = resourceStillAvailable.subtractMany(resourceOccupation.overlapAllowed)

            resourceStillAvailable.resource = resource
            resourceOccupation.overlapAllowed.resource = resource
            workingHours.resource = resource

            let availability = new ResourceAvailabilitySets(resource, resourceOccupation.all, resourceStillAvailable, resourceOccupation.overlapAllowed, workingHours, unavailable)


            availability.hasBreakBlock = true

            this.availability.set(resourceId, availability)

            if (resource.type == ResourceType.branch) {
                branchAvailability = resourceStillAvailable

            }

        }
    }

    getPreparationBlockJustBefore(resourceId: string, date: Date): DateRange {

        let sets = this.availability.get(resourceId)

        let result = sets.overlapAllowed.getRangeWhereToEquals(date)

        return result
    }

    getPreparationBlockJustAfter(resourceId: string, date: Date): DateRange {

        let sets = this.availability.get(resourceId)

        let result = sets.overlapAllowed.getRangeWhereFromEquals(date)

        return result
    }

    hasBreakOnDay(resourceId: string, onDay: Date): boolean {
        let availability = this.availability.get(resourceId)

        if (!availability)
            return false

        let breaks = availability.all.filterByType(PlanningType.brk)

        if (breaks.count() == 0)
            return false

        // check if it is on same day

        return true
    }

    /** All availabilities of 1 resource are grouped within a DateRangeSet.
     *  Since this request is for multiple resources, we return DateRangeSets (plural)!
     */
    getAvailabilities(resources: Resource[]): DateRangeSets {

        if (!Array.isArray(resources) || resources.length == 0)
            return DateRangeSets.empty

        const allSets = new DateRangeSets()

        for (const resource of resources) {

            if (!resource.isGroup) {
                const set = this.getAvailabilitiesForResource(resource)

                if (!set.isEmpty())
                    allSets.addSet(set)  //return 
            }
            else {  // resource.type = group

                //  let result: DateRangeSet = new DateRangeSet()

                for (const childResource of resource.getChildResources()) {

                    const set = this.getAvailabilitiesForResource(childResource)

                    if (!set.isEmpty())
                        allSets.addSet(set)

                    // const childAvailability = this.getAvailability(childResource)

                    // result = result.add(childAvailability)

                }
            }
        }

        return allSets
    }


    /** check the availability of given resources inside range (insideRange), only return blocks > minTime */
    getAvailabilityOfResourcesInRange(resources: Resource[], insideRange: DateRange, minTime: TimeSpan, solution: Solution, excludeSolutionOccupation: boolean, durationAlreadyIncluded: boolean, personId?: string): DateRangeSets {

        if (ArrayHelper.IsEmpty(resources))
            return DateRangeSets.empty

        const allSets = new DateRangeSets()

        for (const resource of resources) {

            let availabilitiesForResource = this.getAvailabilitiesForResource(resource)

            if (availabilitiesForResource.isEmpty())
                continue


            if (solution && excludeSolutionOccupation) {
                var resourceAlreadyOccupiedInSolution = solution.getOccupationForResource(resource, durationAlreadyIncluded, personId)

                if (resourceAlreadyOccupiedInSolution.notEmpty())
                    availabilitiesForResource = availabilitiesForResource.subtractMany(resourceAlreadyOccupiedInSolution)
            }


            availabilitiesForResource = availabilitiesForResource.clip(insideRange)

            if (availabilitiesForResource.isEmpty())
                continue

            availabilitiesForResource = availabilitiesForResource.minimum(minTime)

            if (availabilitiesForResource.isEmpty())
                continue

            allSets.addSet(availabilitiesForResource)
        }

        return allSets
    }

    getWorkingTime(resourceId: string): DateRangeSet {

        if (!resourceId || !this.availability)
            return DateRangeSet.empty

        if (!this.availability.has(resourceId))
            return DateRangeSet.empty


        let availability = this.availability.get(resourceId)

        return availability.workingTime


    }

    getSetForResource(resourceId: string) {

        if (!this.availability.has(resourceId))
            return null

        let availability = this.availability.get(resourceId)

        return availability
    }

    getOccupiedRanges(resourceId: string, dateRange: DateRange): DateRangeSet {

        let availability = this.availability.get(resourceId)

        return availability.workingTime
    }


    getAvailabilitiesForResource(resource: Resource, minTime?: TimeSpan): DateRangeSet {

        // console.warn(`getAvailabilitiesForResource(${resource})`)


        if (!resource?.id || !this.availability)
            return DateRangeSet.empty


        if (!this.availability.has(resource.id))
            return DateRangeSet.empty


        let availability = this.availability.get(resource.id)

        let set: DateRangeSet = availability.available

        if (minTime)
            set = set.minimum(minTime)

        if (set) {
            // we clone, because other logic might make changes
            set = set.clone()
            set.resource = resource
        } else
            set = DateRangeSet.empty

        return set
    }

    breakStillPossible(resource: Resource, dateRange: DateRange): boolean {

        return true
    }







    getAvailableResourcesInRange(resources: Resource[], dateRange: DateRange, requestItem: ResourceRequestItem, solution: Solution, durationAlreadyIncluded: boolean, stopWhenFound = false, checkBreaks = false): ResultWithSolutionNotes<Resource[]> {

        let isPrepTime = requestItem.isPrepTime

        let result = new ResultWithSolutionNotes<Resource[]>()
        result.result = []

        if (!Array.isArray(resources) || resources.length == 0)
            return result

        const availableResources = []

        const staffBreaks = this.ctx.getStaffBreakRanges(this)

        for (const resource of resources) {

            if (resource.isGroup)
                continue

            if (stopWhenFound && availableResources.length >= requestItem.qty)
                break


            /**
             * getAvailabilitiesForResource: will only check inside the schedule of the resource
             * (sometimes we allow that preparations are done outside schedule -> this is covered later)
             * todo: sometimes preparations wan overlap (before/after)
             */
            var resourceAvailabilities = this.getAvailabilitiesForResource(resource)


           // resourceAvailabilities = this.subtractGroupLevelReservations(possibleResources, resourceAvailabilities, ctx, availability, solution)


           
            /** The current solution might already occupy this resource */
            if (solution) {
                var resourceAlreadyOccupiedInSolution = solution.getOccupationForResource(resource, durationAlreadyIncluded)

                if (resourceAlreadyOccupiedInSolution.notEmpty())
                    resourceAvailabilities = resourceAvailabilities.subtract(resourceAlreadyOccupiedInSolution)
            }

            if (resourceAvailabilities.contains(dateRange)) {

                if (checkBreaks && resource.type == ResourceType.human) {

                    let breakStillPossible = staffBreaks.breakStillPossible(resource.id, dateRange)

                    if (breakStillPossible.possible) {
                        availableResources.push(resource)
                        continue
                    } else {
                        solution.addNote(`Break not possible for ${resource.name} if we allocate ${dateRange.toString()}  (break remaining: ${breakStillPossible.remaining?.toString()})`)
                    }

                }
                else {
                    availableResources.push(resource)
                    continue
                }

            }

            /*
            If the schedule of the resource allows planning preparation blocks (not actual treatments) outside the schedule,
            then check if resource is available
            */

            if (isPrepTime && resource.type == ResourceType.location) {   // 


                let activeSchedule = this.ctx.getScheduleOnDate(resource.id, dateRange.from)

                if (!activeSchedule)
                    continue

                let insideSchedule = activeSchedule.isInsideSchedule(dateRange)
                let outsideSchedule = !insideSchedule

                let preparationsOutsideScheduleOk = !activeSchedule.prepIncl

                // check if preparations can be done outside schedule
                if (outsideSchedule) {

                    // remark: inside schedule was already covered above: this.getAvailabilitiesForResource(resource)
                    if (preparationsOutsideScheduleOk) {
                        let existingPlannings = this.ctx.resourcePlannings.filterByResourceDateRange(resource.id, dateRange.from, dateRange.to)

                        if (existingPlannings.isFullAvailable()) {
                            availableResources.push(resource)

                            result.addNote(`Preparation time outside schedule for ${resource.name} at ${dateFns.format(dateRange.from, 'dd/MM HH:mm')} allowed!`)

                            // for debugging
                            activeSchedule = this.ctx.getScheduleOnDate(resource.id, dateRange.from)
                            insideSchedule = activeSchedule.isInsideSchedule(dateRange)
                            outsideSchedule = !insideSchedule
                            preparationsOutsideScheduleOk = !activeSchedule.prepIncl

                            continue

                        }

                    } else {
                        result.addNote(`Preparation time outside schedule for ${resource.name} NOT allowed!`)
                    }

                }

                // if we are inside a working schedule and overlap of preparations is allowed
                if (insideSchedule && requestItem.prepOverlap) {

                    let existingPlannings = this.ctx.resourcePlannings.filterByResourceDateRange(resource.id, dateRange.from, dateRange.to)

                    if (existingPlannings.isPrepTimeOnly()) {
                        availableResources.push(resource)
                        result.addNote(`Overlapping prepartions allowed for '${resource.name}' at ${dateFns.format(dateRange.from, 'dd/MM HH:mm')} allowed!`)
                        continue
                    }
                }
            }
        }

        result.result = availableResources
        return result
    }





}
