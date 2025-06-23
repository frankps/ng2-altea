import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TaskRoutingModule } from './task-routing.module';
import { EditTaskComponent } from './edit-task/edit-task.component';
import { ManageTasksComponent } from './manage-tasks/manage-tasks.component';
import { TaskListComponent } from './task-list/task-list.component';

// Generic imports
import { Bootstrap5Module } from 'ng-common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';
import { TaskDashboardComponent } from './task-dashboard/task-dashboard.component';
import { TodosComponent } from './todos/todos.component';
import { ProductModule } from '../product/product.module';


@NgModule({
  declarations: [
    EditTaskComponent,
    ManageTasksComponent,
    TaskListComponent,
    TaskDashboardComponent,
    TodosComponent,
  ],
  exports: [
    TodosComponent
  ],
  imports: [
    CommonModule,
    TaskRoutingModule,
    NgbModule,
    Bootstrap5Module,
    FormsModule,
    NgSelectModule,
    TranslateModule,
    ModalModule,
    BsDatepickerModule,
    TimepickerModule,
    NgxSpinnerModule,
    ProductModule
  ]
})
export class TaskModule { }
