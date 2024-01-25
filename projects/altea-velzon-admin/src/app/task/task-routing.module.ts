import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaskListComponent } from './task-list/task-list.component';
import { EditTaskComponent } from './edit-task/edit-task.component';
import { ManageTasksComponent } from './manage-tasks/manage-tasks.component';

const routes: Routes = [
  { path: "mobile/", component: TaskListComponent},
  { path: "mobile/:id", component: EditTaskComponent},
  { path: "", component: ManageTasksComponent,  children: [
    { path: ":id", component: EditTaskComponent },
    { path: "new/", component: EditTaskComponent },
  ] }, 
  { path: "manage", component: ManageTasksComponent },
  { path: "list", component: TaskListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TaskRoutingModule { }
