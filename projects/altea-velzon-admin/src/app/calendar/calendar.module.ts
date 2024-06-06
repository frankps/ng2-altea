import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CalendarRoutingModule } from './calendar-routing.module';
import { CalendarComponent } from './calendar/calendar.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { ScheduleModule } from '@syncfusion/ej2-angular-schedule';
import { SyncFusSchedulerComponent } from './sync-fus-scheduler/sync-fus-scheduler.component';

@NgModule({
  declarations: [CalendarComponent, SyncFusSchedulerComponent],
  imports: [CommonModule, CalendarRoutingModule, FullCalendarModule, ScheduleModule],
})
export class CalendarModule {}
