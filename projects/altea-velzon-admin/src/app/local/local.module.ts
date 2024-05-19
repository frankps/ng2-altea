import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LocalRoutingModule } from './local-routing.module';
import { DomoticaComponent } from './domotica/domotica.component';
import { JobsComponent } from './jobs/jobs.component';


@NgModule({
  declarations: [
    DomoticaComponent,
    JobsComponent
  ],
  imports: [
    CommonModule,
    LocalRoutingModule
  ]
})
export class LocalModule { }
