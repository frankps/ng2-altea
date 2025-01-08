/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Order, OrderLine, Product, ProductResource, Resource, ResourcePlanning, ResourcePlannings, ResourceType, Schedule } from "ts-altea-model"
import * as _ from "lodash";
import { TimeSpan } from "./dates/time-span";
import { AvailabilityRequest } from "./availability-request";
import { ResourceOccupationSets, DateRange, DateRangeSet, DateRangeSets } from "./dates";
import { AvailabilityContext } from "./availability-context";
import { ObjectWithId } from 'ts-common'
import { SolutionNote, SolutionNoteLevel } from "./solution";
import * as dateFns from 'date-fns'
import { ResourceRequestItem } from "./resource-request";

export class ResultWithSolutionNotes<T> {
    result: T
    notes: SolutionNote[] = []


    addNote(content: string, level: SolutionNoteLevel = SolutionNoteLevel.info) {

        const note = new SolutionNote(content, level)
        this.notes.push(note)
    }
}


class ResourceAvailability_DoNotUse {

    availability = new Map<string, DateRangeSet>()

    constructor(public ctx: AvailabilityContext) {

        const resources = ctx.getAllNongGroupResources()

        for (const resource of resources) {


            const resourceId = resource.id!

            /*             const defaultSchedule = ctx.getDefaultSchedule(resourceId)
            
                        if (!defaultSchedule) {
                            console.error(`No default schedule found for ${resource.name}`)
                            continue
                        } */

            const resourceActive = ctx.scheduleDateRanges.get(resourceId)

            if (!resourceActive) {
                console.error(`No schedule date ranges found for ${resource.name}`)
                continue
            }

            const resourceOccupation = ctx.getResourceOccupation(resourceId)

            const resourceActiveExtended = resourceActive.union(resourceOccupation.extraAvailable)

            const resourceStillAvailable = resourceActiveExtended.subtract(resourceOccupation.unAvailable)

            this.availability.set(resourceId, resourceStillAvailable)

        }
    }


    getAvailabilitiesForResource(resource: Resource): DateRangeSet {

        if (!resource?.id || !this.availability)  //  || !this.availability.has(resource.id)
            return DateRangeSet.empty

        let set: DateRangeSet | undefined

        if (resource.customSchedule)
            set = this.availability.get(resource.id)
        else
            set = this.availability.get(this.ctx.branchId)  // otherwise we fall back to the default schedule (of the branch)

        if (set) {
            // we clone, because other logic might make changes
            set = set.clone()
            set.resource = resource
        } else
            set = DateRangeSet.empty

        return set
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




    getAvailability(resource: Resource): DateRangeSet {

        if (!resource)
            return DateRangeSet.empty

        if (!resource.isGroup)
            return this.getAvailabilitiesForResource(resource)
        else {  // resource.type = group

            let result: DateRangeSet = new DateRangeSet()

            for (const childResource of resource.getChildResources()) {

                const childAvailability = this.getAvailability(childResource)

                result = result.add(childAvailability)

            }

            return result
        }

    }





}