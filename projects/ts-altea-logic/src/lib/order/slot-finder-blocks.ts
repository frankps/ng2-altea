/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AvailabilityContext, DateRange, DateRangeSet, PlanningBlockSeries, PlanningMode, PossibleSlots, Product, Resource, ResourceAvailability, ResourceRequest, ResourceRequestItem, ResourceType, SlotInfo, TimeSpan } from "ts-altea-model";
import * as _ from "lodash"
import { ResourceRequestOptimizer } from "./resource-request-optimizer";
import { scheduled } from "rxjs";
import * as dateFns from 'date-fns'


export class SlotFinderBlocks {


    static _I: SlotFinderBlocks = new SlotFinderBlocks()

    /** Returns instance of this class */
    static get I(): SlotFinderBlocks {
        return SlotFinderBlocks._I
    }

    findSlots(resReqItem: ResourceRequestItem, inDateRange: DateRange, ctx: AvailabilityContext): DateRangeSet {



        const product = resReqItem.product


        // then we get initial slots from product.plan

        const dateRanges = this.getFullDayStartDates(product, inDateRange, ctx)

        /*
        if (this.isFullDay(inDateRange, ctx)) {   // this means there are no reservations yet 

        } else {
            throw new Error('Not implemented yet!')
        }*/

        return dateRanges


    }

    getFullDayStartDates(product: Product, dateRange: DateRange, ctx: AvailabilityContext): DateRangeSet {

        /** Mostly there is only 1 branch schedule (the default operational mode) active in a given dateRange (can be 1 day for instance),
         *  but exceptionally there can be more branch schedules in a given period.   
         **/
        const schedules = ctx.getBranchSchedules(dateRange)

        let resultBlocks = new DateRangeSet()

        for (let i = 0; i < schedules.byDate.length - 1; i++) {  // -1 because last item is alwas dateRange.to
            const schedule = schedules.byDate[i]
            const nextSchedule = schedules.byDate[i + 1]


            const dateRangeSameSchedule = new DateRange(schedule.start, nextSchedule.start)

            // get definitions for block series for current schedule (= operational mode)
            const blockSeries = product.getBlockSeries(schedule.schedule.id!)

            if (Array.isArray(blockSeries)) {
                // convert to actual dates
                const dateRangeSet = this.getActualBlocks(blockSeries, dateRangeSameSchedule)
                resultBlocks = resultBlocks.add(dateRangeSet)

            }
        }

        return resultBlocks
    }

    /**
 * 
 * @param blockSeries the series definied on product.plan (when product.planMode=block)
 * @param dateRange 
 * @returns 
 */
    getActualBlocks(blockSeries: PlanningBlockSeries[], dateRange: DateRange): DateRangeSet {

        let result = new DateRangeSet()

        for (const series of blockSeries) {

            const dateRangeSet = series.makeBlocks(dateRange)
            result = result.add(dateRangeSet)

        }


        return result

    }


}