import { Component, OnInit, ViewChild } from '@angular/core';
import { DayService, WeekService, WorkWeekService, MonthService, AgendaService, MonthAgendaService, TimelineViewsService, TimelineMonthService, EventSettingsModel, Schedule, EventRenderedArgs } from '@syncfusion/ej2-angular-schedule';
import { DataManager, ODataV4Adaptor, Query } from '@syncfusion/ej2-data';
import * as dateFns from 'date-fns'
import { Unsubscribe } from 'firebase/firestore';
import { ObjectService, OrderFirestoreService, OrderService, ResourcePlanningService, ResourceService, SessionService, TaskService } from 'ng-altea-common';
import { Order, OrderUi, Resource, ResourcePlanningUi, Task, TaskSchedule, TaskStatus } from 'ts-altea-model';
import { ApiListResult, DbQuery, QueryOperator, Translation, ApiResult, ApiStatus, DateHelper, ArrayHelper } from 'ts-common'
import { CalendarBase, BaseEvent } from '../calendar-base';
import { AlteaDb } from 'ts-altea-logic';
/*
https://ej2.syncfusion.com/angular/documentation/schedule/getting-started

Appointments:
https://ej2.syncfusion.com/angular/documentation/schedule/appointments


Colors:
  https://stackoverflow.com/questions/61627767/angular-syncfusion-scheduler-set-color-to-a-single-event
  https://stackblitz.com/edit/angular-udwvvf-fbm7mw?file=app.component.html
  (via oneventRendered)



Implement custom:
https://www.syncfusion.com/forums/152013/using-a-custom-modal-onclick-in-scheduler-component


*/

export class SyncFusSchedulerEvent {
  action: "date" | "view"
  currentDate: Date

  currentView: "Day" | "Week" | "Month" | "WorkWeek" | "Agenda"

}

@Component({
  selector: 'app-sync-fus-scheduler',
  templateUrl: './sync-fus-scheduler.component.html',
  styleUrls: ['./sync-fus-scheduler.component.scss'],
  providers: [DayService, WeekService, WorkWeekService, MonthService, AgendaService, MonthAgendaService, TimelineViewsService, TimelineMonthService]
})
export class SyncFusSchedulerComponent extends CalendarBase implements OnInit {

  i = 0
  @ViewChild('schedule') schedule: Schedule

  public timeFormat: string = "HH:mm";
  currentView: "Day" | "Week" | "Month" | "WorkWeek" | "Agenda" = "Week"


  showTasks: boolean = false

  public eventSettings: EventSettingsModel = {
    dataSource: this.events

  }

  constructor(protected taskSvc: TaskService, sessionSvc: SessionService, private planningSvc: ResourcePlanningService, orderFirestore: OrderFirestoreService, resourceSvc: ResourceService, protected objSvc: ObjectService, protected orderSvc: OrderService) {
    super(sessionSvc, orderFirestore, resourceSvc, new AlteaDb(objSvc))

    //this.implementation = this
    console.log(this.events)

    //this.orderFirestore.getOrders()

  }

  async ngOnInit() {

    const refDate = new Date() //2024,5, 17)


    await this.showWeekEvents(refDate)
    this.currentView = "Week"
    this.schedule.currentView = "Week"  //changeView("Day")
    this.schedule.selectedDate = refDate // dateFns.addHours(refDate, 12)

    // await this.showPlanningWeek()
    // await this.showOrderWeek()
  }

  get calendarColSize() {
    return this.showTasks ? 9 : 12
  }


  toggleShowTasks() {
    this.showTasks = !this.showTasks
  }

  filterChanged(filterName: string) {
    this.refreshEvents()

  }

  refreshSchedule() {
    if (this.schedule)
      this.schedule.refresh()
  }

  /** event triggered by grid when changing dates */
  async navigating(event: SyncFusSchedulerEvent) {

    if (event.action == "view")
      this.currentView = event.currentView

    console.warn(event)

    switch (this.currentView) {

      case "Day":
        this.startOfVisible = dateFns.startOfDay(event.currentDate)
        this.endOfVisible = dateFns.endOfDay(event.currentDate)
        break

      case "Week":
        this.startOfVisible = dateFns.startOfWeek(event.currentDate, { weekStartsOn: 1 })
        this.endOfVisible = dateFns.endOfWeek(event.currentDate, { weekStartsOn: 1 })
        break

      case "Month":
        this.startOfVisible = dateFns.startOfMonth(event.currentDate)
        this.endOfVisible = dateFns.endOfMonth(event.currentDate)
        break

    }

    this.refreshEvents()

    //await this.showEventsBetween(this.startOfVisible, this.endOfVisible)
  }


  oneventRendered(args: any): void {

    //    console.warn(args)

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


  baseEventToEvent(eventBase: BaseEvent) {



    return {
      Id: eventBase.id,

      // always copy over the type
      type: eventBase.type,
      order: eventBase.order,

      Contact: eventBase.contact,
      Subject: eventBase.subject,
      StartTime: eventBase.from,
      StartTimeNum: DateHelper.yyyyMMddhhmm(eventBase.from),
      EndTime: eventBase.to,
      EndTimeNum: DateHelper.yyyyMMddhhmm(eventBase.to),
      CategoryColor: eventBase.color,
      OrderId: eventBase.order?.id,
      Options: eventBase.order?.shortInfo(false, false, true, '<br>'),

      ResourceId: eventBase.resource?.id,

      //  Type: eventBase.type,


    }
  }

  async onActionBegin($event: any) {

    console.warn('onActionBegin', $event)

    if (!$event)
      return


    switch ($event.requestType) {
      case 'eventRemove':

        if (!this.sessionSvc.isPosAdmin()) {

          console.log('Only for POS admin')
          $event.cancel = true

          return
        }


        for (let item of $event.data) {

          console.warn('Start removing item', item)

          let orderUi = item.order

          if (orderUi)
            await this.deleteOrderUi(orderUi)


        }

    }
  }

  async deleteOrderUi(orderUi: OrderUi) {

    console.warn('OrderUi', orderUi)

    let branch = await this.sessionSvc.branch$()

    if (!branch)
      return

    switch (orderUi.type) {

      case 'planning':
        var delPlanning = await this.planningSvc.delete$(orderUi.id)
        console.log(delPlanning)

    }

    var delFirebase = await this.orderSvc.deleteOrderInFirebase(branch.id, orderUi.id)
    console.log(delFirebase)

  }













}
