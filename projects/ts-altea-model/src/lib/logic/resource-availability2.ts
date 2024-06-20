
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Order, OrderLine, Product, ProductResource, Resource, ResourcePlanning, ResourcePlannings, ResourceType, Schedule } from "../altea-schema";
import * as _ from "lodash";
import { TimeSpan } from "./dates/time-span";
import { AvailabilityRequest } from "./availability-request";
import { ResourceOccupationSets, DateRange, DateRangeSet, DateRangeSets, ResourceAvailabilitySets } from "./dates";
import { AvailabilityContext } from "./availability-context";
import { ObjectWithId } from 'ts-common'
import { SolutionNote, SolutionNoteLevel } from "./solution";
import * as dateFns from 'date-fns'
import { ResourceRequestItem } from "./resource-request";
import { ResultWithSolutionNotes } from "./resource-availability";


export class ResourceAvailability2 {

    /** availability indexed by resource id */
    availability = new Map<string, ResourceAvailabilitySets>()

    constructor(public ctx: AvailabilityContext) {

        const resources = ctx.getAllNongGroupResources()

        for (const resource of resources) {

            const resourceId = resource.id!

            let frankId = 'cc682b80-6243-4ac5-92a9-5ceed36111a4'
            if (resourceId == frankId)
                console.error(' FRANK FOUND ----')

            /** get the outer boundaries for this resource */
            let normalScheduleRanges: DateRangeSet //= ctx.scheduleDateRanges.get(resourceId)

            if (resource.customSchedule)
                normalScheduleRanges = ctx.scheduleDateRanges.get(resourceId)
            else
                normalScheduleRanges = ctx.scheduleDateRanges.get(ctx.branchId)


            if (!normalScheduleRanges) {
                console.error(`No schedule date ranges found for ${resource.name}`)
                continue
            }

            // get both the available & un-available date ranges
            const resourceOccupation = ctx.getResourceOccupation2(resourceId)

            const extendedSchedule = normalScheduleRanges.union(resourceOccupation.available)


            let unavailable = resourceOccupation.unAvailable


            if (resource.qty > 1) {

                console.warn('SUM UP Resource usage')

                unavailable = resourceOccupation.unAvailable.sumUp()

                // removeRangesWithQtyLowerThen => for these ranges there is at least 1 resource over
                unavailable = unavailable.removeRangesWithQtyLowerThen(resource.qty)
                console.error(unavailable)

            }



            let resourceStillAvailable = extendedSchedule.subtract(unavailable)
            resourceStillAvailable = resourceStillAvailable.subtract(resourceOccupation.overlapAllowed)






            let availability = new ResourceAvailabilitySets(resourceStillAvailable, resourceOccupation.overlapAllowed)

            this.availability.set(resourceId, availability)

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
    getAvailabilityOfResourcesInRange(resources: Resource[], insideRange: DateRange, minTime: TimeSpan): DateRangeSets {

        if (!Array.isArray(resources) || resources.length == 0)
            return DateRangeSets.empty

        const allSets = new DateRangeSets()

        for (const resource of resources) {

            let availabilitiesForResource = this.getAvailabilitiesForResource(resource)

            availabilitiesForResource = availabilitiesForResource.clip(insideRange)

            availabilitiesForResource = availabilitiesForResource.minimum(minTime)

            allSets.addSet(availabilitiesForResource)
        }

        return allSets
    }


    getAvailabilitiesForResource(resource: Resource, minTime?: TimeSpan): DateRangeSet {

       // console.warn(`getAvailabilitiesForResource(${resource})`)


        if (!resource?.id || !this.availability)  //  || !this.availability.has(resource.id)
            return DateRangeSet.empty

        // | undefined

        if (!this.availability.has(resource.id))
            return DateRangeSet.empty
//        throw new Error(`resource ${resource.name} has NO availabilities!  ${resource.id}`)

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


    getAvailableResourcesInRange(resources: Resource[], dateRange: DateRange, requestItem: ResourceRequestItem, stopWhenFound = true): ResultWithSolutionNotes<Resource[]> {

        let isPrepTime = requestItem.isPrepTime

        let result = new ResultWithSolutionNotes<Resource[]>()
        result.result = []

        if (!Array.isArray(resources) || resources.length == 0)
            return result

        const availableResources = []

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
            const set = this.getAvailabilitiesForResource(resource)

            if (set.contains(dateRange)) {
                availableResources.push(resource)

                continue
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
