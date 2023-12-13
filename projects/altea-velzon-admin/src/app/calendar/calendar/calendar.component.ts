// import { Component } from '@angular/core';
// import { CalendarOptions } from '@fullcalendar/core'; // useful for typechecking
// import dayGridPlugin from '@fullcalendar/daygrid';
import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CalendarOptions, DateSelectArg, EventClickArg, EventApi } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
//import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import listPlugin from '@fullcalendar/list';
import { INITIAL_EVENTS, createEventId } from './event-utils';
import { OrderService, ResourcePlanningService } from 'ng-altea-common';
import { ApiListResult, DbQuery, QueryOperator, Translation, ApiResult, ApiStatus, DateHelper } from 'ts-common'

import * as dateFns from 'date-fns'


@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit {

  calendarVisible = true;
  calendarOptions: CalendarOptions = {
    plugins: [
      interactionPlugin,
      dayGridPlugin,
      timeGridPlugin,
      listPlugin,
      // resourceTimeGridPlugin
    ],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    initialView: 'dayGridMonth',
    // initialEvents: INITIAL_EVENTS, // alternatively, use the `events` setting to fetch from a feed
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventMouseEnter: this.handleEventMouseEnter.bind(this),
    eventsSet: this.handleEvents.bind(this),
    dateClick: this.handleDateClick.bind(this),
    datesSet: this.getEventsFromBackend.bind(this),

    eventDisplay: 'block',
    eventTextColor: 'red'
    /* you can update a remote database when these fire:
    eventAdd:
    eventChange:
    eventRemove:
    */
  };
  currentEvents: EventApi[] = [];

  constructor(private changeDetector: ChangeDetectorRef, private orderSvc: OrderService, private planningSvc: ResourcePlanningService) {
  }

  ngOnInit() {
    //this.getEvents()
  }

  handleEventMouseEnter(args) {

    console.warn(args.event.id)
    console.error(args)

  }

  getEventsFromBackend(payload) {
    /*
      payload.start: Date
      payload.end: Date

      payload.startStr: Date
      payload.endStr: Date

      view.type = 'timeGridDay'
    */


    console.log('visible dates have been changed');
    console.log(payload);

    this.getPlanningEvents(payload.start, payload.end)
  }


  fullCalendarDate(dateNum: number, addMinutes?: number): string {

    var date = DateHelper.parse(dateNum)

    if (addMinutes)
      date = dateFns.addMinutes(date, addMinutes)

    var dateStr = date.toISOString()

    return dateStr
  }

  getOrderEvents(start: Date, end: Date) {

    const query = new DbQuery()
    //query.and('appointment', QueryOperator.equals, true)
    query.and('start', QueryOperator.greaterThanOrEqual, DateHelper.yyyyMMddhhmmss(start))
    query.and('start', QueryOperator.lessThan, DateHelper.yyyyMMddhhmmss(end))

    query.orderBy('start')
    query.include('orderLine')
    query.take = 50

    var result$ = this.planningSvc.query(query)

    result$.subscribe(res => {
      if (res?.data) {
        var plannings = res.data

        var events = plannings.map(order => {

          return {
            id: order.id,
            //    title: order.descr,
            start: this.fullCalendarDate(order.start),
            end: this.fullCalendarDate(order.start, 60)
          }
        }

        )

        console.warn(events)

        this.calendarOptions.events = events


      }
    })

  }


  eventMouseover(event) {

    console.warn(event.id)
    console.log(event)
  }


  eventRenderFunction(event) {

    console.error(event)
  }

  getPlanningEvents(start: Date, end: Date) {

    const query = new DbQuery()
    //query.and('appointment', QueryOperator.equals, true)
    query.and('start', QueryOperator.greaterThanOrEqual, DateHelper.yyyyMMddhhmmss(start))
    query.and('start', QueryOperator.lessThan, DateHelper.yyyyMMddhhmmss(end))

    query.orderBy('start')
    query.take = 50

    var result$ = this.planningSvc.query(query)

    result$.subscribe(res => {
      if (res?.data) {
        var plannings = res.data

        console.error(plannings)

        var events = plannings.map(planning => ({
          id: planning.id,
          title: planning.info ? planning.info.toString() : '',
          start: this.fullCalendarDate(planning.start),
          end: this.fullCalendarDate(planning.end),
          source: planning
        }))

        console.warn(events)

        this.calendarOptions.events = events

      }
    })

  }




  handleDateClick(arg) {
    alert('date click! ' + arg.dateStr);
  }

  handleCalendarToggle() {
    this.calendarVisible = !this.calendarVisible;
  }

  handleWeekendsToggle() {
    const { calendarOptions } = this;
    calendarOptions.weekends = !calendarOptions.weekends;
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    const title = prompt('Please enter a new title for your event');
    const calendarApi = selectInfo.view.calendar;

    calendarApi.unselect(); // clear date selection

    if (title) {
      calendarApi.addEvent({
        id: createEventId(),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay
      });
    }
  }

  handleEventClick(clickInfo: EventClickArg) {
    /*
    if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
      clickInfo.event.remove();
    }
    */
  }

  handleEvents(events: EventApi[]) {
    this.currentEvents = events;
    this.changeDetector.detectChanges();
  }

}





