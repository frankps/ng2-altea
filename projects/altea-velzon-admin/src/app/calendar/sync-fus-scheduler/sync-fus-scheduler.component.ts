import { Component, ViewChild } from '@angular/core';
import { DayService, WeekService, WorkWeekService, MonthService, AgendaService, MonthAgendaService, TimelineViewsService, TimelineMonthService, EventSettingsModel, Schedule, EventRenderedArgs } from '@syncfusion/ej2-angular-schedule';
import { DataManager, ODataV4Adaptor, Query } from '@syncfusion/ej2-data';
import * as dateFns from 'date-fns'
import { OrderService, ResourcePlanningService } from 'ng-altea-common';
import { ApiListResult, DbQuery, QueryOperator, Translation, ApiResult, ApiStatus, DateHelper, ArrayHelper } from 'ts-common'
/*
https://ej2.syncfusion.com/angular/documentation/schedule/getting-started

Appointments:
https://ej2.syncfusion.com/angular/documentation/schedule/appointments


Colors:
  https://stackoverflow.com/questions/61627767/angular-syncfusion-scheduler-set-color-to-a-single-event
  https://stackblitz.com/edit/angular-udwvvf-fbm7mw?file=app.component.html
  (via oneventRendered)





*/

@Component({
  selector: 'app-sync-fus-scheduler',
  templateUrl: './sync-fus-scheduler.component.html',
  styleUrls: ['./sync-fus-scheduler.component.scss'],
  providers: [DayService, WeekService, WorkWeekService, MonthService, AgendaService, MonthAgendaService, TimelineViewsService, TimelineMonthService]
})
export class SyncFusSchedulerComponent {

  i = 0
  @ViewChild('schedule') schedule: Schedule

  public data: object[] = [{
    Id: 1,
    Subject: 'Meeting',
    StartTime: new Date(2024, 5, 6, 10, 0),
    EndTime: new Date(2024, 5, 6, 12, 30),
    CategoryColor: 'red'
  }];


  public eventSettings: EventSettingsModel = {
    dataSource: this.data
  }

  constructor(private planningSvc: ResourcePlanningService) {

    console.log(this.data)
  }

  oneventRendered(args: any): void {
    let categoryColor: string = args.data["CategoryColor"] as string;
    if (!args.element || !categoryColor) {
        return;
    }
    if (this.schedule.currentView === 'Agenda') {
        (args.element.firstChild as HTMLElement).style.borderLeftColor = categoryColor;
    } else {
        args.element.style.backgroundColor = categoryColor;
    }
}


  /** event triggered by grid when changing dates */
  async navigating(event) {

    console.warn(event)

    const startOfVisible = dateFns.startOfWeek(event.currentDate)
    const endOfVisible = dateFns.endOfWeek(event.currentDate)

    let plannings = await this.getPlanningEvents(startOfVisible, endOfVisible)

    let events = plannings.map(planning => ({
      Id: planning.id,
      Subject: planning.info ? planning.info.toString() + (planning.prep ? ' PREP' : '') : '',
      StartTime: planning.startDate,
      EndTime: planning.endDate,
      CategoryColor: 'green'
    }))

    console.log(events)

/*     if (ArrayHelper.AtLeastOneItem(this.data))
      this.data.splice(0, this.data.length) */

    this.data.push(...events)

    this.schedule.refresh()

    console.error(this.data)

    /*
    let start = dateFns.startOfDay(event.currentDate)
    start = dateFns.addHours(start, 8 + this.i)

    let end = dateFns.addHours(start, 1)

    this.data.splice(0)

    this.data.push({
      Id: this.i++,
      Subject: `Meeting ${this.i}`,
      StartTime: start,
      EndTime: end
    })

    console.log(this.data)
*/
  }



  async getPlanningEvents(start: Date, end: Date) {

    const query = new DbQuery()
    //query.and('appointment', QueryOperator.equals, true)
    query.include('resource')
    query.and('start', QueryOperator.greaterThanOrEqual, DateHelper.yyyyMMddhhmmss(start))
    query.and('start', QueryOperator.lessThan, DateHelper.yyyyMMddhhmmss(end))
    query.and('prep', QueryOperator.equals, false)  // no need to show preparation times
    query.and('scheduleId', QueryOperator.equals, null)
    query.and('act', QueryOperator.equals, true)  // only the active plannings

    query.orderBy('start')
    query.take = 50

    var plannings = await this.planningSvc.query$(query)

    return plannings

    /*
    result$.subscribe(res => {
      if (res?.data) {
        var plannings = res.data

        console.error(plannings)

        var events = plannings.map(planning => ({
          id: planning.id,
          title: planning.info ? planning.info.toString() + (planning.prep ? ' PREP' : '') : '',
          start: this.fullCalendarDate(planning.start),
          end: this.fullCalendarDate(planning.end),
          source: planning,
         // color: 'green',
          backgroundColor: planning.resource?.color
        }))

        console.warn(events)

        this.calendarOptions.events = events

      }
    }) */

  }




  /*
      public readonly: boolean = false;
      public selectedDate: Date = new Date(2020, 9, 20);
      private dataManager: DataManager = new DataManager({
         url: 'https://ej2services.syncfusion.com/production/web-services/api/Schedule',
         adaptor: new ODataV4Adaptor,
         crossDomain: true
      });
      public eventSettings: EventSettingsModel = { dataSource: this.dataManager };
  */


}
