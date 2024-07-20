import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserListComponent } from './user-list/user-list.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';

const routes: Routes = [
  { path: "mobile/", component: UserListComponent},
  { path: "mobile/:id", component: EditUserComponent},
  { path: "", component: ManageUsersComponent,  children: [
    { path: ":id", component: EditUserComponent },
    { path: "new/", component: EditUserComponent },
  ] }, 
  { path: "manage", component: ManageUsersComponent },
  { path: "list", component: UserListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlatformRoutingModule { }
