import * as dateFns from 'date-fns'
import { DateRange } from './date-range';

export enum TimeIntervalType {
  hours,
  mins,
  secs,
  ms,
}

export class TimeInterval {
  static hours(
    hours: number,
    difference?: number,
    differenceType?: TimeIntervalType,
  ) {
    return new TimeInterval(
      hours,
      TimeIntervalType.hours,
      difference,
      differenceType,
    );
  }

  static minutes(
    minutes: number,
    difference?: number,
    differenceType?: TimeIntervalType,
  ) {
    return new TimeInterval(
      minutes,
      TimeIntervalType.mins,
      difference,
      differenceType,
    );
  }

  static seconds(
    seconds: number,
    difference?: number,
    differenceType?: TimeIntervalType,
  ) {
    return new TimeInterval(
      seconds,
      TimeIntervalType.secs,
      difference,
      differenceType,
    );
  }

  static milliseconds(
    ms: number,
    difference?: number,
    differenceType?: TimeIntervalType,
  ) {
    return new TimeInterval(
      ms,
      TimeIntervalType.ms,
      difference,
      differenceType,
    );
  }

  protected static incrementMap = {
    [TimeIntervalType.hours]: () => dateFns.addHours,
    [TimeIntervalType.mins]: () => dateFns.addMinutes,
    [TimeIntervalType.secs]: () => dateFns.addSeconds,
    [TimeIntervalType.ms]: () => dateFns.addMilliseconds,
  };

  protected static decrementMap = {
    [TimeIntervalType.hours]: () => dateFns.subHours,
    [TimeIntervalType.mins]: () => dateFns.subMinutes,
    [TimeIntervalType.secs]: () => dateFns.subSeconds,
    [TimeIntervalType.ms]: () => dateFns.subMilliseconds,
  };

  protected addToDate = TimeInterval.incrementMap[this.type]();
  protected removeDifference = TimeInterval.decrementMap[this.differenceType]();

  constructor(
    public readonly interval: number,
    public readonly type: TimeIntervalType,
    public readonly difference = 1,
    public readonly differenceType = TimeIntervalType.secs,
  ) {}

  /**
   * Returns the number of intervals possible withing the range
   */
  takeIntervalsFrom(range: DateRange) {
    const difference = this.takeDifferenceFrom(range);

    return Math.floor(difference / this.interval);
  }

  /**
   * Returns the interval difference between range
   */
  takeDifferenceFrom(range: DateRange) {
    switch (this.type) {
      case TimeIntervalType.hours:
        return dateFns.differenceInHours(range.to, range.from);
      case TimeIntervalType.mins:
        return dateFns.differenceInMinutes(range.to, range.from);
      case TimeIntervalType.secs:
        return dateFns.differenceInSeconds(range.to, range.from);
      case TimeIntervalType.ms:
        return dateFns.differenceInMilliseconds(range.to, range.from);
    }
  }

  /**
   * Returns incremented date of few times by the interval
   */
  increment(date: Date, times = 1, withoutDifference = false) {
    const amount = times * this.interval;
    const newDate = this.addToDate(date, amount);

    return withoutDifference
      ? this.removeDifference(newDate, this.difference)
      : newDate;
  }
}