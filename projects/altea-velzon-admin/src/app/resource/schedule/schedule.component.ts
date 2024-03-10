import { Component, Input, ViewChild, ViewChildren } from '@angular/core';
import { Schedule, ScheduleTimeBlock, WeekSchedule } from 'ts-altea-model'
import { SelectedDay } from '../schedule-day/schedule-day.component';
import { EditResourceComponent } from '../edit-resource/edit-resource.component';
import { ScheduleSchedulingComponent } from '../schedule-scheduling/schedule-scheduling.component';

@Component({
  selector: 'ngx-altea-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss'],
})
export class ScheduleComponent {

  @ViewChild('schedulingComponent') schedulingComponent: ScheduleSchedulingComponent;

  // weeks: WeekSchedule[] = []
  //days = [1, 2, 3, 4, 5, 6,7]

  selectedDay: SelectedDay

  newBlock: ScheduleTimeBlock = new ScheduleTimeBlock()
  @Input() schedule: Schedule
  @Input() readonly = true

  @Input() parent: EditResourceComponent


  constructor() {
    //this.schedule.scheduling
    // this.createDemoSchedule1()

    //this.createDemoScheduling()
  }


  save() {

    console.error("Saving schedule ................ =================================")

    if (this.schedulingComponent)
      this.schedulingComponent.save()
  }


  createDemoSchedule1() {

    const week1 = new WeekSchedule(1)

    this.schedule.weeks.push(week1)

    console.error(week1)

  }

  daySelected(selectedDay: SelectedDay) {
    console.error(selectedDay)

    if (this.readonly)
      return

    this.selectedDay = selectedDay

  }

  addTimeBlock() {

    if (!this.selectedDay)
      return

    this.selectedDay.day.blocks.push(this.newBlock.clone())

    // this.
  }

  deleteBlock(block) {

    if (!this.selectedDay)
      return

    this.selectedDay.day.removeBlock(block)

  }

  close() {
    this.selectedDay = null
  }

  removeWeek(weekArrayIdx: number) {

    this.schedule.weeks.splice(weekArrayIdx, 1)

  }

  addWeek() {

    console.warn('Add week')

    if (!Array.isArray(this.schedule.weeks))
      this.schedule.weeks = []

    const week1 = new WeekSchedule(this.schedule.weeks.length + 1)

    this.schedule.weeks.push(week1)

  }




}
