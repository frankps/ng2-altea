import { Component, EventEmitter, Input, Output } from '@angular/core';
import { values } from 'lodash';
import * as dateFns from 'date-fns'

@Component({
  selector: 'time-picker',
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.scss'],
})
export class TimePickerComponent {

  _time: string | Date = "12:00"

  @Input() set time(value: string | Date) {
    this._time = value


    if (typeof value === 'string') {

      console.warn(`Timepicker received a string: ${value}`)

      const items = value.split(':')
      this.hour = items[0]
      this.minute = items[1]
    } else { // should be a date

      console.warn(`Timepicker received a Date:`, value)

      const date: Date = value as Date

      this.hour = ("0" + date.getHours()).slice(-2)
      this.minute = ("0" + date.getMinutes()).slice(-2)
    }

  }

  get time(): string | Date {
    return this._time
  }

  @Output() timeChange = new EventEmitter<string | Date>();

  hours = [...Array(23).keys()].map(i => ("0" + i).slice(-2))
  hour = "09"

  minutes = [...Array(13).keys()].map(i => ("0" + (i * 5)).slice(-2))
  minute = "00"

  timeChanged() {
    if (typeof this._time === 'string')
      this._time = this.hour + ':' + this.minute
    else {

      this._time = dateFns.setHours(this._time, +this.hour)
      this._time = dateFns.setMinutes(this._time, +this.minute)
      this._time = dateFns.setSeconds(this._time, 0)
      this._time = dateFns.setMilliseconds(this._time, 0)
    }



    this.timeChange.emit(this._time)
  }



}
