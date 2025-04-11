import * as dateFns from 'date-fns'
import { Timestamp } from 'rxjs'
import { TimeUnit } from '../../altea-schema'
import * as _ from "lodash";
/* export enum TimeUnit {
    hours,
    minutes,
    seconds
} */

export class TimeOfDay {

    hours = 0
    minutes = 0

    constructor(hours = 0, minutes = 0) {
        this.hours = hours
        this.minutes = minutes
    }

    /** time in format hh:mm */
    static parse(time: string): TimeOfDay | undefined {

        if (!time)
            return undefined

        let [hours, minutes] = time.split(':').map(Number)

        return new TimeOfDay(hours, minutes)
    }
}

/** A TimeSpan is internally represented in seconds */
export class TimeSpan {

    seconds = 0

    constructor(time = 0, unit = TimeUnit.seconds) {
        this.addTime(time, unit)
    }

    clone() {
        return new TimeSpan(this.seconds)
    }

    minutes(): number {
        return _.round(this.seconds / 60, 2)
    }

    hours(): number {
        return _.round(this.seconds / 3600, 2)
    }

    static days(days = 1): TimeSpan {
        return this.hours(days * 24)
    }

    static hours(hours: number, minutes = 0, seconds = 0): TimeSpan {
        return new TimeSpan(hours * 3600 + minutes * 60 + seconds)
    }

    static minutes(minutes: number, seconds = 0): TimeSpan {
        return new TimeSpan(minutes * 60 + seconds)
    }

    static seconds(seconds = 0): TimeSpan {
        return new TimeSpan(seconds, TimeUnit.seconds)
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
        if (!timeSpan)
            return
        
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
