import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DomoticaComponent } from './domotica/domotica.component';
import { JobsComponent } from './jobs/jobs.component';

const routes: Routes = [
  { path: "domo", component: DomoticaComponent },
  { path: "jobs", component: JobsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LocalRoutingModule { }
