/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { OrderLine, OrderPerson, Product, ProductResource, Resource, ResourceType, Schedule, Solution } from "ts-altea-model"
import { OffsetDuration, OffsetDurationParams } from "./offset-duration"
import { TimeSpan } from "./dates/time-span"
import { DateRangeSet } from "./dates"
import * as _ from "lodash";
import { Type } from "class-transformer";
import { ArrayHelper, ObjectWithId } from "ts-common";

export class ResourceRequestItem extends ObjectWithId {
    //person?: OrderPerson

    /** only filled in if request is based on a resource group  */
    @Type(() => Resource)
    resourceGroup?: Resource

    @Type(() => Resource)
    resources: Resource[] = []
    personId?: string

/*     @Type(() => TimeSpan)
    offset = TimeSpan.zero */

    @Type(() => OffsetDurationParams)
    offsetDuration: OffsetDurationParams


/*     @Type(() => TimeSpan)
    private _duration = TimeSpan.zero */

    /** the number of resources that should be allocated from the resourceGroup (or from resources) */
    qty = 1

    /** is preparation time => no actual treatment, but preparations or cleaning (coming from ProductResource.prep) */
    isPrepTime: boolean = false
    prepOverlap: boolean = false

    /** the originating product resource */
    @Type(() => ProductResource)
    productResource: ProductResource

    // set to true when processed
    isProcessed = false

    /** if this item should use same resource as othe item (use same staff member) */
    affinity: ResourceRequestItem = null

    /** the availability after applying all rules: schedules, resourcePlannings, etc ... */
    // availability: DateRangeSet = DateRangeSet.empty

    constructor(public orderLine: OrderLine, public product: Product, public resourceType: ResourceType) {
        super()
    }

    /** initially, the duration was just a fixed value. Now it can fluctuate based on the solution at hand. 
     *  The user might request a wellness of 3h (request item is 3h), but the system concludes at a certain moment that only a block of 2h is possible.
     *  => all request items that are related to this wellness duration should adapt to 3 hours
     */
    durationInSeconds(solution?: Solution): number {
        return this.offsetDuration.calcDurationSeconds(solution)
    }

    duration(solution?: Solution): TimeSpan {
        return this.offsetDuration.calcDuration(solution)
    }

    offsetInSeconds(solution?: Solution): number {
        return this.offsetDuration.calcOffsetSeconds(solution)
    }

    offset(solution?: Solution): TimeSpan {
        return this.offsetDuration.calcOffset(solution)
    }
    /*
    get duration2(): TimeSpan {
        return this._duration
    }

    set duration2(value: TimeSpan) {
        this._duration = value
    }
        */

    hasAffinity(): boolean {
        return (this.affinity != null && this.affinity != undefined)
    }

    clone(): ResourceRequestItem {
        const clone = new ResourceRequestItem(this.orderLine, this.product, this.resourceType)

        clone.resourceGroup = this.resourceGroup
        clone.resources.push(...this.resources)
        clone.personId = this.personId

        clone.offsetDuration = this.offsetDuration.clone()
      //  clone._duration = this._duration.clone()

        clone.qty = this.qty

        clone.isPrepTime = this.isPrepTime
        clone.prepOverlap = this.prepOverlap

        clone.productResource = this.productResource

        // added isProcessed & affinity        
        clone.isProcessed = this.isProcessed
        clone.affinity = this.affinity


        clone.orderLine = this.orderLine
        clone.product = this.product
        clone.resourceType = this.resourceType

        return clone
    }

    endsAt(solution?: Solution): TimeSpan {
        let offset = this.offset(solution)
        let duration = this.duration(solution)
        return offset.add(duration)
    }
    //offsetDuration: OffsetDuration = new OffsetDuration()

    samePersonAndResourceType(personId: string, resType: ResourceType) {

        if (ArrayHelper.IsEmpty(this.resources))
            return false

        var resIdx = this.resources.findIndex(r => r.type == resType)

        if (resIdx == -1)
            return false

        // here we already have a resource of same type

        return this.personId == personId
    }

    /*
    seconds(): number {
        return this.duration.seconds
    }*/

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

    hasItemsWithMinQty(minQty: number): boolean {

        if (this.isEmpty())
            return false

        let idx = this.items.findIndex(i => i.qty >= minQty)

        return (idx >= 0)
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


    getItemsForResource(resourceId: string, sortOrder: 'asc' | 'desc' = 'asc'): ResourceRequestItem[] {
        const items = this.items.filter(i => i.resources.findIndex(r => r.id == resourceId) >= 0)

        return _.orderBy(items, item => item.offsetInSeconds(), sortOrder)

    }





}