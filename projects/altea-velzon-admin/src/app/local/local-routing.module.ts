import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DomoticaComponent } from './domotica/domotica.component';
import { JobsComponent } from './jobs/jobs.component';
import { DialogflowComponent } from './dialogflow/dialogflow.component';
import { DoorAccessComponent } from './door-access/door-access.component';

const routes: Routes = [
  { path: "domo", component: DomoticaComponent },
  { path: "jobs", component: JobsComponent },
  { path: "door-access", component: DoorAccessComponent },
  { path: "dialogflow", component: DialogflowComponent },
];

@NgModule({ 
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LocalRoutingModule { }
