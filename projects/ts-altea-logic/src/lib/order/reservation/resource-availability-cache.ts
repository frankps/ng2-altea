import { AvailabilityRequest, ResourcePlanning, ResourceRequest } from 'ts-altea-model'
import { AlteaDb } from '../../general/altea-db'
import { IDb } from '../../interfaces/i-db'
import * as _ from "lodash";

export class ResourceAvailabilityCacheToRemove {

    alteaDb: AlteaDb

    

    constructor(protected db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }

    

    // constructor(resourceRequest: ResourceRequest) {

    // }

    initialize(availabilityRequest: AvailabilityRequest) {

        //this.availabilityRequest = availabilityRequest
    
    }

    async getResourcePlannings(availabilityRequest: AvailabilityRequest) : Promise<ResourcePlanning[]> {

        const resourceIds: string[] = []

        /*
        Old Logic:

                List<ResourcePlanning> planning = this.Ctx.ResourcePlanning.Where(rp => ids.Contains(rp.ResourceId)
                && rp.End >= Context.justThisOneDay
                //      && rp.End >= now
                && rp.Start <= end
                && rp.IsActive
                && rp.OrderLine.Order.OrderStatus != OrderStatus.Cancelled
                && rp.OrderLine.Order.OrderStatus != OrderStatus.TimedOut
                && ((rp.OrderLine.Order.OrderStatus == OrderStatus.Confirmed && (Context.orderId != rp.OrderLine.OrderId)) || Context.lockId == "" || rp.OrderLine.Order.Lock != Context.lockId))
                .OrderBy(rp => rp.Start).ToList();
        */


        const resourcePlannings = await this.alteaDb.resourcePlannings(availabilityRequest.from, availabilityRequest.to, resourceIds, false)

        return resourcePlannings

    }



    // getAvailability() {

    // }
}