import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DaySchedule, Gender, OnlineMode, Product, ProductType, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, WeekSchedule } from 'ts-altea-model'
//import { DaySchedule } from '../../../../../../libs/ts-altea-common/src';
import { ConnectTo } from 'ts-common'

export class SelectedDay {
  week: WeekSchedule
  day: DaySchedule

  constructor(week: WeekSchedule, day: DaySchedule) {
    this.week = week
    this.day = day
  }
}

@Component({
  selector: 'ngx-altea-schedule-day',
  templateUrl: './schedule-day.component.html',
  styleUrls: ['./schedule-day.component.scss'],
})
export class ScheduleDayComponent {

  selected = false

  @Input() readonly = true

  @Input() week: WeekSchedule
  @Input() day: DaySchedule

  @Output() daySelected: EventEmitter<SelectedDay> = new EventEmitter();

  select() {
    this.daySelected.emit(new SelectedDay(this.week, this.day))
  }
  // toggleSelection() {

  //   this.selected = !this.selected

  //   console.error(this.selected)

  // }



}

/*

  import { Output, EventEmitter } from '@angular/core';
  @Output() delete: EventEmitter<ac.Job> = new EventEmitter();
  this.delete.emit(job)


  <  (delete)="deleteFunc($event)">

  */