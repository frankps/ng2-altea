import { Component, OnInit, ViewChild } from '@angular/core';
import { DayService, WeekService, WorkWeekService, MonthService, AgendaService, MonthAgendaService, TimelineViewsService, TimelineMonthService, EventSettingsModel, Schedule, EventRenderedArgs } from '@syncfusion/ej2-angular-schedule';
import { DataManager, ODataV4Adaptor, Query } from '@syncfusion/ej2-data';
import * as dateFns from 'date-fns'
import { Unsubscribe } from 'firebase/firestore';
import { OrderFirestoreService, OrderService, ResourcePlanningService } from 'ng-altea-common';
import { OrderUi, Resource, ResourcePlanningUi } from 'ts-altea-model';
import { ApiListResult, DbQuery, QueryOperator, Translation, ApiResult, ApiStatus, DateHelper, ArrayHelper } from 'ts-common'
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
export class SyncFusSchedulerComponent implements OnInit {

  i = 0
  @ViewChild('schedule') schedule: Schedule

  public data: object[] = [];

  currentView: "Day" | "Week" | "Month" | "WorkWeek" | "Agenda" = "Week"
  startOfVisible: Date
  endOfVisible: Date

  public eventSettings: EventSettingsModel = {
    dataSource: this.data
  }

  constructor(private planningSvc: ResourcePlanningService, private orderFirestore: OrderFirestoreService) {

    console.log(this.data)

    //this.orderFirestore.getOrders()

  }

  async ngOnInit() {
    await this.showPlanningWeek() 
    // await this.showOrderWeek()
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
        this.startOfVisible = dateFns.startOfWeek(event.currentDate)
        this.endOfVisible = dateFns.endOfWeek(event.currentDate)
        break

      case "Month":
        this.startOfVisible = dateFns.startOfMonth(event.currentDate)
        this.endOfVisible = dateFns.endOfMonth(event.currentDate)
        break

    }



  //  await this.showOrdersBetween(this.startOfVisible, this.endOfVisible)
    await this.showPlanningBetween(this.startOfVisible, this.endOfVisible)



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



  /** ----------------- For order view -------------------------- */
  /*  =========================================================== */

  orderUiToEvent(orderUi: OrderUi) {

    return {
      Id: orderUi.id,
      Subject: orderUi.shortInfo(),
      StartTime: orderUi.startDate,
      EndTime: orderUi.endDate,
      CategoryColor: 'green'
    }

  }

  async showOrderWeek(date: Date = new Date()) {

    const startOfVisible = dateFns.startOfWeek(date)
    const endOfVisible = dateFns.endOfWeek(date)

    await this.showOrdersBetween(startOfVisible, endOfVisible)
  }

  unsubscribe: Unsubscribe

  async showOrdersBetween(start: Date, end: Date) {

    if (this.unsubscribe)  // we unsubscribe from previous changes
      this.unsubscribe()

    this.unsubscribe = await this.orderFirestore.getOrderUisBetween(start, end, this.showOrderUis, this)

  }

  /** This is a callback function that is called by the OrderFirestoreService whenever there are changes to the visible orders 
   *  Important: this.* will not work (because it's coming from callback context), instead use context.*
  */
  showOrderUis(context: SyncFusSchedulerComponent, orderUis: OrderUi[]) {
    let events = []

    if (ArrayHelper.AtLeastOneItem(orderUis)) {
      console.warn(orderUis)
      events = orderUis.map(orderUi => context.orderUiToEvent(orderUi))
    }

    console.log(events)

    context.data.splice(0, context.data.length)
    context.data.push(...events)

    context.schedule.refresh()
  }

  /** ----------------- For planning view ----------------------- */
  /*  =========================================================== */

  planningUiToEvent(planningUi: ResourcePlanningUi) {

    return {
      Id: planningUi.id,
      Subject: planningUi.order?.shortInfo(),
      StartTime: planningUi.startDate,
      EndTime: planningUi.endDate,
      CategoryColor: (planningUi.resource as Resource)?.color
    }

  }


  async showPlanningWeek(date: Date = new Date()) {

    const startOfVisible = dateFns.startOfWeek(date)
    const endOfVisible = dateFns.endOfWeek(date)

    await this.showPlanningBetween(startOfVisible, endOfVisible)
  }


  async showPlanningBetween(start: Date, end: Date) {

    if (this.unsubscribe)  // we unsubscribe from previous changes
      this.unsubscribe()

    this.unsubscribe = await this.orderFirestore.getPlanningUisBetween(start, end, this.showPlanningUis, this)

  }

  /** This is a callback function that is called by the OrderFirestoreService whenever there are changes to the visible orders 
   *  Important: this.* will not work (because it's coming from callback context), instead use context.*
  */
  showPlanningUis(context: SyncFusSchedulerComponent, planningUis: ResourcePlanningUi[]) {
    let events = []

    if (ArrayHelper.AtLeastOneItem(planningUis)) {
      console.warn(planningUis)
      events = planningUis.map(planningUi => context.planningUiToEvent(planningUi))
    }

    console.log(events)

    context.data.splice(0, context.data.length)
    context.data.push(...events)

    context.schedule.refresh()
  }









}
