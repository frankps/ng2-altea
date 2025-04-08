/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ArrayHelper, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
import { DurationMode, Order, AvailabilityContext, OrderLine, OrderPerson, Product, ProductResource, ResourceRequest, ResourceRequestItem, Schedule, SchedulingType, TimeSpan, TimeUnit, OffsetDuration, DurationReference, Resource, ResourceType, OrderLineSummary, OffsetDurationParams } from 'ts-altea-model'
import { Observable } from 'rxjs'
import { AlteaDb } from '../../general/altea-db'
import { IDb } from '../../interfaces/i-db'
import * as _ from "lodash";


export class PersonInfo {
    offset: TimeSpan = TimeSpan.zero

    // affinity for staff (same person should be treated by same staff member)
    staff: ResourceRequestItem = null


    // affinity for other resources (same location, etc...)
    resourceGroups: Map<string, ResourceRequestItem> = new Map<string, ResourceRequestItem>()

}

export class CreateResourceRequest {
    alteaDb: AlteaDb

    constructor(protected db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    /** after migration we had apparently persons defined on orderLine, that where not in order.persons */
    getPersonsFromOrderLines(order: Order): OrderPerson[] {

        if (ArrayHelper.IsEmpty(order.lines))
            return []

        let personIds = order.lines.filter(o => ArrayHelper.NotEmpty(o.persons))
            .flatMap(o => o.persons)

        personIds = _.uniq(personIds)

        let persons = personIds.map(pId => new OrderPerson(pId, pId))

        return persons
    }


    create(availabilityCtx: AvailabilityContext): ResourceRequest[] {

        console.error('CreateResourceRequest')

        const order = availabilityCtx.order


        if (!order || !order.lines)
            return []

        const orderlinesWithPlanning = order.linesWithPlanning()

        if (orderlinesWithPlanning.length == 0)
            return []

        const persons: OrderPerson[] = []

        if (order.hasPersons())
            persons.push(...order.persons!)
        else  // if no persons are specified, then we assume order is just for 1 person named '1'
        {
            let personsFromLines = this.getPersonsFromOrderLines(order)

            if (ArrayHelper.IsEmpty(personsFromLines))
                persons.push(new OrderPerson('1', '1'))
            else
                persons.push(...personsFromLines)

            order.persons = personsFromLines
            order.markAsUpdated('persons')
        }


        /**
         *  get the schudules used in orderLine.product.resources.scheduleIds
         */
        const scheduleIds = this.getScheduleIds(orderlinesWithPlanning, availabilityCtx)



        if (scheduleIds.length == 0)
            scheduleIds.push('')  // we can push anything, just to make sure the for loop below is executed once

        console.warn('scheduleIds', scheduleIds)

        const requests: ResourceRequest[] = []

        for (const scheduleId of scheduleIds) {

            const schedule = availabilityCtx.getSchedule(scheduleId)
            const request = this.createResourceRequest(schedule, persons, order, orderlinesWithPlanning, availabilityCtx)
            request.branchId = availabilityCtx.branchId
            requests.push(request)
        }

        return requests
    }


    private createResourceRequest(schedule: Schedule | undefined, persons: OrderPerson[], order: Order, orderLines: OrderLine[], availabilityCtx: AvailabilityContext): ResourceRequest {

        const resourceRequest = new ResourceRequest("Initial resource request")
        resourceRequest.persons = persons

        resourceRequest.schedule = schedule

        // const offsetPerPerson = new Map<string, TimeSpan>()

        const personInfos = new Map<string, PersonInfo>()


        for (const person of persons) {
            // offsetPerPerson.set(person.id!, TimeSpan.zero)

            personInfos.set(person.id!, new PersonInfo())
        }


        for (const orderLine of orderLines) {

            const product = orderLine.product!

            //product.preTime

            let productResources: ProductResource[]

            if (schedule?.id)
                productResources = product.getResourcesForSchedule(schedule.id)     //product.resources
            else
                productResources = product.resources


            if (ArrayHelper.IsEmpty(productResources)) continue   // should not happen

            const orderLinePersonIds = orderLine.hasPersons() ? orderLine.persons! : [persons[0].id!]  // fall back to 1st specified person id

            let personIdx = 0
            let allocateResources = true

            let personOffsetToAdd = TimeSpan.zero


            /* most of the time there will be only 1 personId
            Important: we will break this loop if personIdx >= orderLine.qty (see last line)
            */
            for (const personId of orderLinePersonIds) {

                // const personOffset = offsetPerPerson.get(personId)!
                const personInfo = personInfos.get(personId)!

                personOffsetToAdd = TimeSpan.zero

                for (const productResource of productResources) {



                    let resource = availabilityCtx.getResource(productResource.resourceId!)

                    if (!resource)
                        continue

                    const offsetDuration = this.getOffsetDurationParams(orderLine, product, productResource)

                    const defaultDuration = offsetDuration.defaultDuration()
                    if (defaultDuration.seconds == 0)
                        continue

                    const resReqItem = new ResourceRequestItem(orderLine, product, resource.type!)

                    if (!resource)  // not sure if this is needed
                        resource = productResource.resource!

                    resReqItem.qty = 1 // orderLine.qty 

                    if (resource.isGroup) {
                        resReqItem.resourceGroup = resource

                        let childResources = resource.getChildResources()


                        if (resource.type == ResourceType.human) {

                            /** check if preferred staff was selected */
                            if (ArrayHelper.NotEmpty(order.resPrefs?.humIds)) {
                                let humanIds = order.resPrefs?.humIds
                                childResources = childResources.filter(r => humanIds.indexOf(r.id) >= 0)
                            }

                            /* Check affinity (same staff member for same person): the first request item defines the staff member for a certain person
                            */
                            if (personInfo.staff) {
                                resReqItem.affinity = personInfo.staff
                            } else
                                personInfo.staff = resReqItem
                        } else { // non-staff resource group (ex room)

                            if (personInfo.resourceGroups.has(resource.id)) {
                                let previousRequestItem = personInfo.resourceGroups.get(resource.id)
                                resReqItem.affinity = previousRequestItem
                            } else {
                                personInfo.resourceGroups.set(resource.id, resReqItem)
                            }

                        }

                        resReqItem.addResources(childResources)
                        resReqItem.qty *= productResource.groupQty
                    } else
                        resReqItem.addResource(resource ? resource : productResource.resource!)

                    resReqItem.personId = personId

                    resReqItem.offsetDuration = offsetDuration.clone()

                    //   resReqItem.duration2 = offsetDuration.duration

                    const personOffset: TimeSpan = personInfo.offset.clone()
                    // const offset = personOffset.clone()

                    // resReqItem.offset = personOffset.add(offsetDuration.offset)
                    resReqItem.offsetDuration.addToOffset(personOffset)

                    if (productResource.flex) {

                        // check if we already have items
                        let items = resourceRequest.getItemsForResource(resource.id)

                        if (ArrayHelper.NotEmpty(items)) {

                            if (productResource.flexAfter) {
                                let item = items[0]
                                // resReqItem.offset = item.offset.add(item.duration2)
                                resReqItem.offsetDuration.offset = item.offsetDuration.offset.add(item.duration())


                            } else {
                                let item = items[items.length - 1]
                                //resReqItem.offset = item.offset.subtract(resReqItem.duration2)
                                resReqItem.offsetDuration.offset = item.offsetDuration.offset.subtract(item.duration())
                            }
                        }
                    }

                    resReqItem.isPrepTime = productResource.prep
                    resReqItem.prepOverlap = productResource.prepOverlap
                    resReqItem.productResource = productResource


                    resourceRequest.add(resReqItem)

                    /* 
                    if (orderLine.qty > 1) {
                        for (let i = 2; i <= orderLine.qty; i++) {
                            resourceRequest.add(resReqItem.clone())
                        }
                    } */

                    // at the end we will increment 
                    if (offsetDuration.duration.seconds > personOffsetToAdd.seconds)
                        personOffsetToAdd.seconds = offsetDuration.duration.seconds


                    /** sometimes duration is also encoded via parameters (it allows the resource request to adapt)
                     * Introduced for wellness (ex: customer request is 3 hours, but system decides to offer only 2 hours)
                     */

                    if (ArrayHelper.NotEmpty(offsetDuration.durationParams)) {

                        for (let durationParam of offsetDuration.durationParams) {

                            let val = offsetDuration.defaults.get(durationParam)

                            if (val)
                                personOffsetToAdd = personOffsetToAdd.add(val)

                        }
                    }

                }

                personInfo.offset.addInternal(personOffsetToAdd)
                //   personOffset.addInternal(personOffsetToAdd)

                personIdx++

                /** in case of wellness, we have just 1 resource to allocate for multiple persons */
                if (personIdx >= orderLine.qty)
                    break
            }

            /** in case of wellness, we have just 1 resource to allocate for multiple persons 
             *  => we have to update all personOffsets of all other persons involved
            */
            if (personIdx < orderLinePersonIds.length) {

                for (let idx = personIdx; idx < orderLinePersonIds.length; idx++) {
                    const personId = orderLinePersonIds[idx]

                    const personInfo = personInfos.get(personId)!
                    personInfo.offset.addInternal(personOffsetToAdd)

                    //                    const personOffset = offsetPerPerson.get(personId)!
                    //                  personOffset.addInternal(personOffsetToAdd)
                }
            }


            console.error(orderLine)
        }

        if (resourceRequest.hasItemsWithMinQty(2))
            this.deduplicateItems(resourceRequest)


        return resourceRequest
    }

    /** Converts resourceRequest.items with qty > 1 to individual items with qty=1 
     * 
     * Was introduced for product 'Duo massage' which has customers=2
     *  this caused a ResourceRequestItem with qty=2   (2 x 'Massage Staff')
     *  So this method will covert it into 2 separate ResourceRequestItem
     *    1 x 'Massage Staff' for person1 (= customer 1)
     *    1 x 'Massage Staff' for person2 (= customer 2)
    */
    deduplicateItems(resourceRequest: ResourceRequest) {

        if (!resourceRequest || resourceRequest.isEmpty())
            return resourceRequest

        let newItems: ResourceRequestItem[] = []



        for (let item of resourceRequest.items) {

            let origQty = item.qty

            if (origQty <= 0)
                continue

            item.qty = 1
            newItems.push(item)

            if (origQty >= 2) {
                for (let i = 2; i <= origQty; i++) {

                    let clonedItem = item.clone()

                    if (item.orderLine?.persons?.length >= i) {
                        clonedItem.personId = item.orderLine.persons[i - 1]
                    }

                    newItems.push(clonedItem)
                }
            }

        }

        resourceRequest.items = newItems

        return resourceRequest
    }

    /**
     * get the schudules used in orderLine.product.resources.scheduleIds
     * 
     * @param orderLines 
     * @returns 
     */
    getScheduleIds(orderLines: OrderLine[], ctx: AvailabilityContext): string[] {

        if (!orderLines || orderLines.length == 0)
            return []

        const scheduleIds: string[] = []

        for (const orderLine of orderLines) {

            const product = orderLine.product!
            const productResources = product.resources

            if (!productResources) continue

            for (const productResource of productResources) {

                if (!productResource.scheduleIds)
                    continue

                for (const scheduleId of productResource.scheduleIds) {

                    if (scheduleId && scheduleIds.indexOf(scheduleId) == -1)
                        scheduleIds.push(scheduleId)

                }
            }
        }

        // filter the active schedules
        const requestRange = ctx.request.getDateRange()
        const activeScheduleIds = ctx.getActiveSchedulesDuring(requestRange, scheduleIds)

        return activeScheduleIds
    }

    getDurationOfOptionIds(optionIds: string[], line: OrderLine): number {

        if (!line || ArrayHelper.IsEmpty(optionIds))
            return 0

        const optionValuesWithDurations = line.allOptionValues(optionIds)
        const optionDuration = _.sumBy(optionValuesWithDurations, 'dur')

        return optionDuration
    }

    getOffsetDurationParams(line: OrderLine, product: Product, productResource: ProductResource): OffsetDurationParams {

        let wellnessId = '31eaebbc-af39-4411-a997-f2f286c58a9d'

        let gelId = 'dfc76cad-8957-4ed5-9782-7a4e2044bd9b'
        let suikerId = '5e0f259f-b57c-4e45-b75f-1aad81a29cf6'  // suikerontharing vrouw
        let laserId = '5e0f259f-b57c-4e45-b75f-1aad81a29aaa'

        let customDurationIds = [wellnessId, gelId, suikerId, laserId]


        let useParameters = product.id && customDurationIds.indexOf(product?.id) >= 0 // (product?.id == wellnessId || product?.id == gelId)  // this should come from a DB setting in future

        //let useParameters = false

        let productDurationParamId = product.id + '_duration'
        let productDurationParamUsed = false

        const offsetDuration = new OffsetDurationParams()

        const productDuration = TimeSpan.zero
        productDuration.addMinutes(product.duration)

        if (product.hasPre)
            productDuration.addMinutes(product.preTime)

        if (product.hasPost)
            productDuration.addMinutes(product.postTime)


        /*
        
        // OLD LOGIC

        const optionValues = line.allOptionValues()

        const optionDuration = _.sumBy(optionValues, 'dur')

        productDuration.addMinutes(optionDuration)
        */

        /** Add duration of option values:
         *  optionIdsAlwaysInclude = for options having duration and that we always need to include  (hasDuration && addDur)
         *  specificOptionIds = for specific options (optionDur=true, then look at optionIds) */


        //  NEW LOGIC


        let optionIdsAlwaysInclude = product.getOptionIds(o => o.hasDuration && o.addDur)

        let optionAlwaysIncludeDuration = this.getDurationOfOptionIds(optionIdsAlwaysInclude, line)

        productDuration.addMinutes(optionAlwaysIncludeDuration)


        let duration = TimeSpan.zero

        switch (productResource.durationMode) {
            case DurationMode.product:

                if (useParameters) {
                    offsetDuration.durationParams.push(productDurationParamId)
                    productDurationParamUsed = true
                } else {
                    duration = duration.add(productDuration)
                }

                break
            case DurationMode.custom:
                duration.addMinutes(productResource.duration)

                // If we need to add duration of certain options
                if (productResource.optionDur && ArrayHelper.NotEmpty(productResource.optionIds)) {

                    let optionDuration = this.getDurationOfOptionIds(productResource.optionIds, line)
                    duration.addMinutes(optionDuration)

                }

                if (productResource.reference == DurationReference.end) {
                    if (useParameters) {
                        offsetDuration.offsetParams.push(productDurationParamId)
                        productDurationParamUsed = true
                    } else {

                        offsetDuration.offset = offsetDuration.offset.add(productDuration)
                    }
                }

                //   

                if (productResource.offset)
                    offsetDuration.offset.addMinutes(productResource.offset)

                if (productResource.back) {
                    offsetDuration.offset = offsetDuration.offset.subtract(duration)
                }

                break


        }

        if (productDurationParamUsed) {
            offsetDuration.defaults.set(productDurationParamId, productDuration)
        }


        offsetDuration.duration = duration


        // if (productResource.durationMode == DurationMode.product) {

        // }

        return offsetDuration
    }

}