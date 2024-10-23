import * as dateFns from 'date-fns'
import { Timestamp } from 'rxjs'
import { TimeUnit } from '../../altea-schema'

/* export enum TimeUnit {
    hours,
    minutes,
    seconds
} */

/** A TimeSpan is internally represented in seconds */
export class TimeSpan {

    seconds = 0

    constructor(time = 0, unit = TimeUnit.seconds) {
        this.addTime(time, unit)
    }

    clone() {
        return new TimeSpan(this.seconds)
    }

    static hours(hours: number, minutes = 0, seconds = 0): TimeSpan {
        return new TimeSpan(hours * 3600 + minutes * 60 + seconds)
    }

    static minutes(minutes: number, seconds = 0): TimeSpan {
        return new TimeSpan(minutes * 60 + seconds)
    }

    add(timeSpan: TimeSpan): TimeSpan {
        return new TimeSpan(this.seconds + timeSpan.seconds)
    }

    subtract(timeSpan: TimeSpan): TimeSpan {
        return new TimeSpan(this.seconds - timeSpan.seconds)
    }

    times(multiplier: number) {
        return new TimeSpan(this.seconds * multiplier)
    }

    addInternal(timeSpan: TimeSpan): void {
        this.seconds += timeSpan.seconds
    }

    addToDate(date: Date): Date {

        return dateFns.addSeconds(date, this.seconds)
    }

    addTime(time: number, unit = TimeUnit.seconds) {

        let secondsToAdd = 0
        switch (unit) {
            case TimeUnit.hours:
                secondsToAdd = time * 3600
                break
            case TimeUnit.minutes:
                secondsToAdd = time * 60
                break
            case TimeUnit.seconds:
                secondsToAdd = time
                break
        }

        this.seconds += secondsToAdd
    }

    addMinutes(minutes = 0) {
        this.seconds += minutes * 60
    }

    toString() {

        let total = this.seconds
        const sec = total % 60
        total = (total - sec) / 60

        const min = total % 60
        total = (total - min) / 60

        const hour = total % 60
        total = (total - hour) / 60

        let items = []

        if (hour != 0)
            items.push(`${hour}h`)

        if (min != 0)
            items.push(`${min}m`)

        if (sec != 0)
            items.push(`${sec}s`)

        return items.join(':')

    }

    static get zero() {
        return new TimeSpan()
    }
}
