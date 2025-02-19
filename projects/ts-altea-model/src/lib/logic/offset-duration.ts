import { ArrayHelper, ObjectHelper } from "ts-common"
import { TimeSpan } from "./dates/time-span"
import { Solution } from "./solution"


export class OffsetDuration {

    offset = TimeSpan.zero
    duration = TimeSpan.zero
}

/**
 *  Initially the duration was fixed (request for Wellness of 3h) => we used OffsetDuration
 *  But now the system can decide to allocate only 2h.
 * 
 *  So the 3hours will be specified as a parameter (product.id + '_duration') and will be placed in the defaults.
 *  Later on the defaults can change by solution.
 */
export class OffsetDurationParams extends OffsetDuration {

    offsetParams: string[] = []
    durationParams: string[] = []

    defaults: Map<string, TimeSpan> = new Map<string, TimeSpan>()

    defaultDuration(): TimeSpan {

        let duration = this.duration

        for (const paramId of this.durationParams) {
            let defaultValue = this.defaults.get(paramId)

            if (defaultValue)
                duration = duration.add(defaultValue)
        }

        return duration
    }

    clone(): OffsetDurationParams {
        let clone = ObjectHelper.clone(this, OffsetDurationParams)
        return clone
    }


    calcDuration(solution?: Solution): TimeSpan  {

        let duration = this.duration

        if (ArrayHelper.IsEmpty(this.durationParams))
            return duration

        for (const paramId of this.durationParams) {

            let paramValue: TimeSpan

            if (solution?.overrides?.has(paramId)) 
                paramValue = solution.overrides.get(paramId)
            else
                paramValue = this.defaults.get(paramId)

            if (paramValue)
                duration = duration.add(paramValue)
        }

        return duration
    }

    calcDurationSeconds(solution?: Solution): number  {
        let timespan = this.calcDuration(solution)
        return timespan.seconds
    }

    calcOffset(solution?: Solution): TimeSpan  {

        let offset = this.offset

        if (ArrayHelper.IsEmpty(this.offsetParams))
            return offset

        for (const paramId of this.offsetParams) {

            let paramValue: TimeSpan

            if (solution?.overrides?.has(paramId)) 
                paramValue = solution.overrides.get(paramId)
            else
                paramValue = this.defaults.get(paramId)

            if (paramValue)
                offset = offset.add(paramValue)
        }

        return offset
    }

    calcOffsetSeconds(solution?: Solution): number  {
        let timespan = this.calcOffset(solution)
        return timespan.seconds
    }


}