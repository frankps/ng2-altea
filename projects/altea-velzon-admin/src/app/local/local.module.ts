import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LocalRoutingModule } from './local-routing.module';
import { DomoticaComponent } from './domotica/domotica.component';
import { JobsComponent } from './jobs/jobs.component';

import { FormsModule } from '@angular/forms';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { Bootstrap5Module } from 'ng-common';
import { NgSelectModule } from '@ng-select/ng-select';
import { DialogflowComponent } from './dialogflow/dialogflow.component';
import { DoorAccessComponent } from './door-access/door-access.component';

@NgModule({
  declarations: [
    DomoticaComponent,
    JobsComponent,
    DialogflowComponent,
    DoorAccessComponent
  ],
  imports: [
    CommonModule,
    LocalRoutingModule,
    FormsModule, 
    NgbModule, 
    BsDatepickerModule,
    Bootstrap5Module,    
    NgSelectModule,
  ]
})
export class LocalModule { }
