/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
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
            const request = this.createResourceRequest(schedule, persons, orderlinesWithPlanning, availabilityCtx)
            request.branchId = availabilityCtx.branchId
            requests.push(request)
        }

        return requests
    }


    private createResourceRequest(schedule: Schedule | undefined, persons: OrderPerson[], orderLines: OrderLine[], availabilityCtx: AvailabilityContext): ResourceRequest {

        const resourceRequest = new ResourceRequest("Initial resource request")
        resourceRequest.persons = persons

        resourceRequest.schedule = schedule


        const offsetPerPerson = new Map<string, TimeSpan>()

        for (const person of persons)
            offsetPerPerson.set(person.id!, TimeSpan.zero)

        for (const orderLine of orderLines) {

            const product = orderLine.product!

            let productResources: ProductResource[]

            if (schedule?.id)
                productResources = product.getResourcesForSchedule(schedule.id)     //product.resources
            else
                productResources = product.resources


            if (!productResources) continue   // should not happen

            const orderLinePersonIds = orderLine.hasPersons() ? orderLine.persons! : [persons[0].id!]  // fall back to 1st specified person id

            // most of the time there will be only 1 personId
            for (const personId of orderLinePersonIds) {

                const personOffset = offsetPerPerson.get(personId)!

                const personOffsetToAdd = TimeSpan.zero

                for (const productResource of productResources) {

                    let resource = availabilityCtx.getResource(productResource.resourceId!)

                    if (!resource)
                        continue

                    const offsetDuration = this.getDuration(orderLine, product, productResource)

                    const resReqItem = new ResourceRequestItem(orderLine, product, resource.type!)

                    if (!resource)  // not sure if this is needed
                        resource = productResource.resource!

                    if (resource.isGroup) {
                        resReqItem.resourceGroup = resource
                        resReqItem.addResources(resource.getChildResources())

                    } else
                        resReqItem.addResource(resource ? resource : productResource.resource!)

                    resReqItem.personId = personId
                    resReqItem.duration = offsetDuration.duration


                    const offset = personOffset.clone()
                    resReqItem.offset = offset.add(offsetDuration.offset)

                    resReqItem.qty = productResource.groupQty

                    resReqItem.isPrepTime = productResource.prep
                    resReqItem.productResource = productResource


                    resourceRequest.add(resReqItem)

                    // at the end we will increment 
                    if (offsetDuration.duration.seconds > personOffsetToAdd.seconds)
                        personOffsetToAdd.seconds = offsetDuration.duration.seconds


                }

                personOffset.addInternal(personOffsetToAdd)
                
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

                break


        }

        offsetDuration.duration = duration


        // if (productResource.durationMode == DurationMode.product) {

        // }

        return offsetDuration
    }

}