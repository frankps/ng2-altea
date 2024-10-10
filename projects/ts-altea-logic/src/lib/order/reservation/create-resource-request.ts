/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ArrayHelper, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
import { DurationMode, Order, AvailabilityContext, OrderLine, OrderPerson, Product, ProductResource, ResourceRequest, ResourceRequestItem, Schedule, SchedulingType, TimeSpan, TimeUnit, OffsetDuration, DurationReference, Resource, ResourceType } from 'ts-altea-model'
import { Observable } from 'rxjs'
import { AlteaDb } from '../../general/altea-db'
import { IDb } from '../../interfaces/i-db'
import * as _ from "lodash";



export class CreateResourceRequest {
    alteaDb: AlteaDb

    constructor(protected db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
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
        else  // if no persons are specified, then we assume order is just for 1 person named 'default'
            persons.push(new OrderPerson('default', 'default'))


        const scheduleIds = this.getScheduleIds(orderlinesWithPlanning)

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


        const offsetPerPerson = new Map<string, TimeSpan>()

        for (const person of persons)
            offsetPerPerson.set(person.id!, TimeSpan.zero)

        for (const orderLine of orderLines) {

            const product = orderLine.product!



            //product.preTime

            let productResources: ProductResource[]

            if (schedule?.id)
                productResources = product.getResourcesForSchedule(schedule.id)     //product.resources
            else
                productResources = product.resources


            if (!productResources) continue   // should not happen

            const orderLinePersonIds = orderLine.hasPersons() ? orderLine.persons! : [persons[0].id!]  // fall back to 1st specified person id

            let personIdx = 0
            let allocateResources = true

            let personOffsetToAdd = TimeSpan.zero


            // most of the time there will be only 1 personId
            for (const personId of orderLinePersonIds) {

                const personOffset = offsetPerPerson.get(personId)!

                personOffsetToAdd = TimeSpan.zero

                for (const productResource of productResources) {

                    let resource = availabilityCtx.getResource(productResource.resourceId!)

                    if (!resource)
                        continue

                    const offsetDuration = this.getDuration(orderLine, product, productResource)

                    const resReqItem = new ResourceRequestItem(orderLine, product, resource.type!)

                    if (!resource)  // not sure if this is needed
                        resource = productResource.resource!

                    resReqItem.qty = 1 // orderLine.qty 

                    if (resource.isGroup) {
                        resReqItem.resourceGroup = resource

                        let childResources = resource.getChildResources()

                        /** check if preferred staff was selected */
                        if (resource.type == ResourceType.human && ArrayHelper.NotEmpty(order.resPrefs?.humIds)) {
                            let humanIds = order.resPrefs?.humIds
                            childResources = childResources.filter(r => humanIds.indexOf(r.id) >= 0)
                        }

                        resReqItem.addResources(childResources)
                        resReqItem.qty *= productResource.groupQty
                    } else
                        resReqItem.addResource(resource ? resource : productResource.resource!)

                    resReqItem.personId = personId
                    resReqItem.duration = offsetDuration.duration


                    const offset = personOffset.clone()
                    resReqItem.offset = offset.add(offsetDuration.offset)



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


                }

                personOffset.addInternal(personOffsetToAdd)

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
                    const personOffset = offsetPerPerson.get(personId)!
                    personOffset.addInternal(personOffsetToAdd)
                }
            }


            console.error(orderLine)
        }

        return resourceRequest

    }


    getScheduleIds(orderLines: OrderLine[]): string[] {

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

        return scheduleIds
    }

    getDuration(line: OrderLine, product: Product, productResource: ProductResource): OffsetDuration {


        const offsetDuration = new OffsetDuration()


        const productDuration = TimeSpan.zero
        productDuration.addMinutes(product.duration)

        if (product.hasPre)
            productDuration.addMinutes(product.preTime)

        if (product.hasPost)
            productDuration.addMinutes(product.postTime)

        const optionValues = line.allOptionValues()

        const optionDuration = _.sumBy(optionValues, 'dur')

        productDuration.addMinutes(optionDuration)




        let duration = TimeSpan.zero

        switch (productResource.durationMode) {
            case DurationMode.product:

                duration = duration.add(productDuration)
                break
            case DurationMode.custom:
                duration.addMinutes(productResource.duration)

                if (productResource.reference == DurationReference.end)
                    offsetDuration.offset = offsetDuration.offset.add(productDuration)

                if (productResource.offset)
                    offsetDuration.offset.addMinutes(productResource.offset)

                break


        }

        offsetDuration.duration = duration


        // if (productResource.durationMode == DurationMode.product) {

        // }

        return offsetDuration
    }

}