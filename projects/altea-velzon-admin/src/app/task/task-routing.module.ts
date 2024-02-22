import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaskListComponent } from './task-list/task-list.component';
import { EditTaskComponent } from './edit-task/edit-task.component';
import { ManageTasksComponent } from './manage-tasks/manage-tasks.component';
import { TaskDashboardComponent } from './task-dashboard/task-dashboard.component';

const routes: Routes = [
  { path: "mobile/", component: TaskListComponent},
  { path: "mobile/:id", component: EditTaskComponent},
  { path: "manage", component: ManageTasksComponent,  children: [
    { path: ":id", component: EditTaskComponent },
    { path: "new/", component: EditTaskComponent },
  ] }, 
 // { path: "manage", component: ManageTasksComponent },
  { path: "list", component: TaskListComponent },
  { path: "dashboard", component: TaskDashboardComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TaskRoutingModule { }
