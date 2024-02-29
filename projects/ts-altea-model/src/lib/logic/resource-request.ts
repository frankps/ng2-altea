/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { OrderLine, OrderPerson, Product, ProductResource, Resource, ResourceType, Schedule } from "../altea-schema"
import { OffsetDuration } from "./offset-duration"
import { TimeSpan } from "./dates/time-span"
import { DateRangeSet } from "./dates"
import * as _ from "lodash";

export class ResourceRequestItem {
    //person?: OrderPerson

    /** only filled in if request is based on a resource group  */
    resourceGroup?: Resource

    resources: Resource[] = []
    personId?: string

    offset = TimeSpan.zero
    duration = TimeSpan.zero

    /** the number of resources that should be allocated from the resourceGroup (or from resources) */
    qty = 1

    /** is preparation time => no actual treatment, but preparations or cleaning */
    isPrepTime: boolean = false
    prepOverlap: boolean = false

    /** the originating product resource */
    productResource: ProductResource

    // set to true when processed
    isProcessed = false

    /** the availability after applying all rules: schedules, resourcePlannings, etc ... */
    // availability: DateRangeSet = DateRangeSet.empty

    constructor(public orderLine: OrderLine, public product: Product, public resourceType: ResourceType) {

    }

    get endsAt(): TimeSpan {
        return this.offset.add(this.duration)
    }
    //offsetDuration: OffsetDuration = new OffsetDuration()

    seconds(): number {
        return this.duration.seconds
    }

    addResource(resource: Resource) {
        this.resources.push(resource)
    }

    addResources(resources: Resource[]) {
        this.resources.push(...resources)
    }

    /** check if this request has resources (optionally: of a certain type) */
    hasResources(type?: ResourceType) {

        if (!type)
            return Array.isArray(this.resources) && this.resources.length > 0
        else
            return Array.isArray(this.resources) && this.resources.filter(r => r.type === type).length > 0

    }

    resourceNames(separator = ', '): string {

        let allNames = this.resources.map(r => r.shortOrName()).join(separator)
        return allNames
    }


    hasResourceGroups() {
        return Array.isArray(this.resources) && this.resources.filter(r => r.isGroup).length > 0
    }

    clone(): ResourceRequestItem {
        const clone = new ResourceRequestItem(this.orderLine, this.product, this.resourceType)

        clone.resourceGroup = this.resourceGroup
        clone.resources.push(...this.resources)
        clone.personId = this.personId

        clone.orderLine = this.orderLine
        clone.product = this.product

        clone.offset = this.offset.clone()
        clone.duration = this.duration.clone()

        return clone
    }
}


export class ResourceRequest {

    branchId?: string


    /** specified if request is only valid for branch schedule (ex. normal operations, holidays, ...) */
    schedule?: Schedule

    persons: OrderPerson[] = []

    items: ResourceRequestItem[] = []

    constructor(public info = "") { }

    clone(clonePersons = true, cloneItems = true): ResourceRequest {

        const clone = new ResourceRequest()

        clone.schedule = this.schedule

        if (clonePersons)
            clone.persons = this.persons.map(p => p.clone())

        if (cloneItems)
            clone.items = this.items.map(i => i.clone())

        return clone
    }

    add(...items: ResourceRequestItem[]) {
        this.items.push(...items)
    }

    isEmpty(): boolean {
        return (!Array.isArray(this.items) || this.items.length === 0)
    }

    hasItemsToProcess(): boolean {
        if (this.isEmpty())
            return false

        return (this.items.findIndex(i => !i.isProcessed) >= 0)
    }

    nextItemToProcess(): ResourceRequestItem {
        if (this.isEmpty())
            return undefined

        return this.items.find(i => !i.isProcessed)

    }

    itemsNotYetProcessed(): ResourceRequestItem[] {

        if (this.isEmpty())
            return []

        return this.items.filter(i => !i.isProcessed)
    }

    getAllResources() {

        const allResources = this.items.flatMap(item => item.resources)
        const resourceIds = allResources.filter(r => r?.id).map(res => res!.id!)

        return resourceIds
    }


    getItemsForResource(resourceId: string): ResourceRequestItem[] {
        const items = this.items.filter(i => i.resources.findIndex(r => r.id == resourceId) >= 0)

        return _.orderBy(items, 'offset.seconds')
    }





}