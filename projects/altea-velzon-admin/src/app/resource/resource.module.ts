import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ResourceRoutingModule } from './resource-routing.module';
import { ManageResourcesComponent } from './manage-resources/manage-resources.component';
import { EditResourceComponent } from './edit-resource/edit-resource.component';
import { ResourceListComponent } from './resource-list/resource-list.component';
import { NewResourceComponent } from './new-resource/new-resource.component';

import { Bootstrap5Module } from 'ng-common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';

import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ScheduleComponent } from './schedule/schedule.component';
import { ScheduleDayComponent } from './schedule-day/schedule-day.component';
import { ScheduleSchedulingComponent } from './schedule-scheduling/schedule-scheduling.component';
import { ResourceGroupsComponent } from './resource-groups/resource-groups.component';
import { ResourcePlanningComponent } from './resource-planning/resource-planning.component';
import { NgCommonModule } from 'ng-common';
import { ResourceUserLinkComponent } from './resource-user-link/resource-user-link.component';
import { ProductModule } from '../product/product.module';
@NgModule({
  declarations: [
    ManageResourcesComponent,
    EditResourceComponent,
    ResourceListComponent,
    NewResourceComponent,
    ScheduleComponent,
    ScheduleDayComponent,
    ScheduleSchedulingComponent,
    ResourceGroupsComponent,
    ResourcePlanningComponent,
    ResourceUserLinkComponent,
  ],
  imports: [
    CommonModule,
    ResourceRoutingModule,
    NgbModule,
    Bootstrap5Module,
    FormsModule,
    NgSelectModule,
    TranslateModule,
    ModalModule,
    BsDatepickerModule,
   // TimepickerModule,
    NgxSpinnerModule,
    NgCommonModule,
    ProductModule
  ],
})
export class ResourceModule {}
