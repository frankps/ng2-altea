import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CalendarComponent } from './calendar/calendar.component';
import { SyncFusSchedulerComponent } from './sync-fus-scheduler/sync-fus-scheduler.component';

const routes: Routes = [
  { path: "fullcalendar", component: CalendarComponent },
  { path: "syncfusion", component: SyncFusSchedulerComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CalendarRoutingModule { }
