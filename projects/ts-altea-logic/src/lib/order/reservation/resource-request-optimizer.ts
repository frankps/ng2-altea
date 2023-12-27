
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PossibleSlots, Resource, ResourceAvailability, ResourceRequest, ResourceRequestItem, ResourceType, SlotInfo, TimeSpan } from "ts-altea-model";
import * as _ from "lodash"


export class ResourceSet {

    constructor(public resources: Resource[] = []) {

    }

    static get empty() {
        return new ResourceSet()
    }


    isEmpty(): boolean {
        return (!Array.isArray(this.resources) || this.resources.length === 0)
    }

    add(...resources: Resource[]) {
        this.resources.push(...resources)
    }

    replaceGroupsByChildren(): ResourceSet {

        if (!Array.isArray(this.resources) || this.resources.length == 0)
            return ResourceSet.empty

        const result = ResourceSet.empty

        for (const resource of this.resources) {

            if (!resource.isGroup)
                result.add(resource)
            else
                result.add(...resource.getChildResources())

        }

        return result
    }

    filterByType(type: ResourceType): ResourceSet {

        const filtered = this.resources.filter(r => r.type == type)

        return new ResourceSet(filtered)
    }

    static intersectionMulti(sets: ResourceSet[]): ResourceSet {

        return sets.reduce((a, b) => ResourceSet.intersection(a, b))
    }

    /** the intersection of resources between 2 sets */
    static intersection(set1: ResourceSet, set2: ResourceSet): ResourceSet {

        if (!set1 || !set2 || !Array.isArray(set1.resources) || !Array.isArray(set2.resources))
            return ResourceSet.empty

        const intersection = _.intersectionBy(set1.resources, set2.resources, 'id')

        return new ResourceSet(intersection)
    }

    /** the intersection of resources between 2 sets */
    static intersectionOfArrays(set1: Resource[], set2: Resource[]): Resource[] {
        if (!Array.isArray(set1) || !Array.isArray(set2))
            return []

        const intersection = _.intersectionBy(set1, set2, 'id')
        return intersection
    }




}

/** If an order contains multiple treatments for the same customer, then we will try to allocate same resources 
 * (staff & room) for this customer.  */
export class ResourceRequestOptimizer {

    static _I: ResourceRequestOptimizer = new ResourceRequestOptimizer()

    /** Returns instance of this class */
    static get I(): ResourceRequestOptimizer {
        return ResourceRequestOptimizer._I
    }

    /*
    replaceResourceGroupsByChildren(...resourceRequests: ResourceRequest[]): ResourceRequest[] {

        const expandedRequests = []

        for (const resourceRequest of resourceRequests) {

            const expandedRequest = this.replaceResourceGroupsByChildrenIndividual(resourceRequest)
            expandedRequests.push(expandedRequest)

        }

        return expandedRequests
    }
    */

    optimize(...resourceRequests: ResourceRequest[]): ResourceRequest[] {

        const optimizedRequests: ResourceRequest[] = []

        for (const resourceRequest of resourceRequests) {

            const optimizedRequest = this.optimizeIndividual(resourceRequest)

            if (optimizedRequest)
                optimizedRequests.push(optimizedRequest)

        }

        return optimizedRequests


    }



    private optimizeIndividual(resourceRequest: ResourceRequest): ResourceRequest | null {

        const optimizedRequest = new ResourceRequest("Optimized resource request")

        // review the requests per person (most often there will be only 1 person = 1 client/customer per order)
        for (const person of resourceRequest.persons) {

            // we only consider the resource request items for this person=customer
            const itemsPerson = resourceRequest.items.filter(rr => rr.personId == person.id)

            // get the distinct resource types needed (human, room, device)
            const resourceTypesForPerson = _.uniq(itemsPerson.map(item => item.resourceType))

            for (const resourceType of resourceTypesForPerson) {

                // only the resource request items for current PERSON and current RESOURCE TYPE
                const itemsPersonResourceType = itemsPerson.filter(rr => rr.resourceType == resourceType)

                const resourcesPerRequest = itemsPersonResourceType.map(item => new ResourceSet(item.resources))

                const preferredResources = this.findPreferredResources(resourcesPerRequest, resourceType)

                if (preferredResources.length > 0) {
                    const mergedItems = this.mergeResourceRequestItems(itemsPersonResourceType, preferredResources)
                    optimizedRequest.add(...mergedItems)
                }
            }


            /*
            const resourcesPerRequest = resourceRequestItems.map(rr => new ResourceSet(rr.resources))

            // search personel 
            const bestHumanResources = this.findBestResources(resourcesPerRequest, ResourceType.human)

            if (bestHumanResources.length > 0) {
                const mergedItems = this.mergeResourceRequestItems(resourceRequestItems, bestHumanResources)
                optimizedRequest.add(...mergedItems)
            }
            */


        }

        return optimizedRequest
    }



    replaceResourceGroupsByChildren(...resourceRequests: ResourceRequest[]): ResourceRequest[] {

        const expandedRequests = []

        for (const resourceRequest of resourceRequests) {

            const expandedRequest = this.replaceResourceGroupsByChildrenIndividual(resourceRequest)
            expandedRequests.push(expandedRequest)

        }

        return expandedRequests
    }



    private replaceResourceGroupsByChildrenIndividual(resourceRequest: ResourceRequest): ResourceRequest {

        if (resourceRequest.isEmpty())
            return resourceRequest

        const expandedRequest = resourceRequest.clone(true, false)
        expandedRequest.info = "Groups replaced by child resources"

        for (const item of resourceRequest.items) {

            const newItem = item.clone()

            if (item.hasResourceGroups()) {

                const resourceSet = new ResourceSet(item.resources)
                const expandedResourceSet = resourceSet.replaceGroupsByChildren()

                newItem.resources = expandedResourceSet.resources

            }

            expandedRequest.items.push(newItem)
        }

        return expandedRequest

    }



    /** If a customer has more treatments in an order:
        1/ then we prefer that the same staff member performs all treatment 
        2/ we prefer that the same room is used */
    findPreferredResources(resourcesPerRequest: ResourceSet[], type: ResourceType): Resource[] {

        if (!Array.isArray(resourcesPerRequest))
            return []

        // replace all groups resources by their actual members
        const realResourcesPerRequest = resourcesPerRequest.map(resourceSet => resourceSet.replaceGroupsByChildren())

        // only consider the requested resourceType (staff or room or device ....)
        let resourceScope = realResourcesPerRequest.map(resourceSet => resourceSet.filterByType(type))

        // remove empty resource sets => the non-human sets => rooms etc..
        resourceScope = resourceScope.filter(rs => !rs.isEmpty())

        const intersection = ResourceSet.intersectionMulti(resourceScope)

        return intersection.resources
    }


    /**
     * 
     * @param resourceRequestItems only contains items for a certain PERSON and for a certain RESOURCE TYPE
     * @param preferredResources already pre-calculated preferred resources
     * @returns 
     */
    mergeResourceRequestItems(resourceRequestItems: ResourceRequestItem[], preferredResources: Resource[]): ResourceRequestItem[] {

        if (!Array.isArray(resourceRequestItems) || resourceRequestItems.length == 0)
            return []

        // we should only merge if intervals are next to each other
        // replace resource by best resource 

        const mergedItems: ResourceRequestItem[] = []

        let previousItem: ResourceRequestItem | undefined

        for (const item of resourceRequestItems) {

            if (!previousItem) {
                previousItem = item.clone()
                previousItem.resources = preferredResources
            }
            else {

                if (previousItem.endsAt.seconds == item.offset.seconds) {
                    previousItem.duration = previousItem.duration.add(item.duration)
                } else {

                    mergedItems.push(previousItem)
                    previousItem = undefined

                }

            }



            // this should be optional, because we already calculated before: preferredResources is subset of item.resources
            // const overlappingResources = ResourceSet.intersectionOfArrays(item.resources, preferredResources)

            // if (overlappingResources.length > 0) {
            //     const newItem = item.clone()
            //     newItem.resources = overlappingResources
            //     mergedItems.push(newItem)
            // } else {
            //     mergedItems.push(item)
            // }
        }

        if (previousItem)
            mergedItems.push(previousItem)


        return mergedItems
    }


    /** Items will only be merged if there is an overlap between item.resources and newResources */
    mergeResourceRequestItemsOld(resourceRequestItems: ResourceRequestItem[], newResources: Resource[]): ResourceRequestItem[] {

        if (!Array.isArray(resourceRequestItems) || resourceRequestItems.length == 0)
            return []

        const mergedItems: ResourceRequestItem[] = []

        const toMerge: ResourceRequestItem[] = []

        let overlappingResources: Resource[] = []

        for (const item of resourceRequestItems) {

            // item.resources contains a group => NO OVERLAP

            overlappingResources = ResourceSet.intersectionOfArrays(item.resources, newResources)

            if (overlappingResources.length > 0) {
                toMerge.push(item)
            } else {

                // we have an item with no resource-verlap => we merge previously collected
                if (toMerge.length > 0) {
                    const merged = this.merge(toMerge, overlappingResources)
                    mergedItems.push(merged)
                }

                // add the item that could not be merged
                mergedItems.push(item.clone())
            }
        }

        if (toMerge.length > 0) {
            const merged = this.merge(toMerge, overlappingResources)
            mergedItems.push(merged)
        }

        return mergedItems
    }


    merge(items: ResourceRequestItem[], resources: Resource[]): ResourceRequestItem {

        if (!Array.isArray(items) || items.length == 0)
            throw new Error("At least 1 item are required for a merge")

        const item = new ResourceRequestItem(items[0].orderLine, items[0].product, items[0].resourceType)

        item.resources = resources

        item.offset = items[0].offset

        const seconds = _.sumBy(items, 'duration.seconds')
        item.duration = new TimeSpan(seconds)

        return item
    }




}