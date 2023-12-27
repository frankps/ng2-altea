/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AvailabilityContext, DateRange, DateRangeSet, PlanningBlockSeries, PlanningMode, PossibleSlots, Product, Resource, ResourceAvailability, ResourceRequest, ResourceRequestItem, ResourceType, SlotInfo, TimeSpan } from "ts-altea-model";
import * as _ from "lodash"
import { ResourceRequestOptimizer } from "./resource-request-optimizer";
import { scheduled } from "rxjs";
import * as dateFns from 'date-fns'


export class SlotFinderContinuous {


    static _I: SlotFinderContinuous = new SlotFinderContinuous()

    /** Returns instance of this class */
    static get I(): SlotFinderContinuous {
        return SlotFinderContinuous._I
    }



    findSlots(resReqItem: ResourceRequestItem, inDateRange: DateRange, ctx: AvailabilityContext): DateRangeSet {



        const product = resReqItem.product


        // then we get initial slots from product.plan


        return DateRangeSet.empty


    }

}